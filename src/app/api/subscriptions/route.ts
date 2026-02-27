import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { subscriptionSchema } from '@/lib/validations'
import { successResponse, errorResponse } from '@/lib/utils'
import { sendSubscriptionConfirmation, sendSubscriptionStatusEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const subscriptions = await prisma.subscription.findMany({
            where: { userId: user.id },
            include: {
                variant: { include: { product: true } },
                address: true,
                schedules: {
                    where: { date: { gte: new Date() } },
                    orderBy: { date: 'asc' },
                    take: 30,
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return successResponse(subscriptions)
    } catch (error) {
        console.error('Subscriptions GET error:', error)
        return errorResponse('Failed to fetch subscriptions', 500)
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const body = await request.json()
        const parsed = subscriptionSchema.safeParse(body)
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message)

        const { variantId, addressId, frequency, quantity, startDate } = parsed.data

        // Validate variant
        const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
        if (!variant) return errorResponse('Product variant not found', 404)

        // Validate address & Mumbai PIN
        const address = await prisma.address.findFirst({ where: { id: addressId, userId: user.id } })
        if (!address) return errorResponse('Address not found', 404)

        const serviceArea = await prisma.serviceableArea.findFirst({
            where: { pincode: address.pincode, isActive: true }
        })
        if (!serviceArea) return errorResponse('Delivery not available in your area', 400)

        // P1: Validate start date is not in the past
        const start = new Date(startDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (start < today) {
            return errorResponse('Start date cannot be in the past', 400)
        }

        // P1: Check wallet has enough balance for at least 7 days
        const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
        const dailyCost = variant.price * quantity
        const daysToCheck = frequency === 'DAILY' ? 7 : frequency === 'ALTERNATE' ? 4 : 1
        const requiredBalance = dailyCost * daysToCheck
        if (!wallet || wallet.balance < requiredBalance) {
            return errorResponse(
                `Insufficient wallet balance. You need at least ₹${requiredBalance} (${daysToCheck} deliveries × ₹${dailyCost}/delivery). Current balance: ₹${wallet?.balance || 0}`,
                400
            )
        }

        // Create subscription
        const subscription = await prisma.subscription.create({
            data: {
                userId: user.id,
                variantId,
                addressId,
                frequency,
                quantity,
                pricePerUnit: variant.price,
                startDate: start,
                nextDelivery: start,
                status: 'ACTIVE',
            },
            include: {
                variant: { include: { product: true } },
                address: true,
            }
        })

        // Generate delivery schedules for next 30 days
        const schedules = []
        const current = new Date(start)
        for (let i = 0; i < 30; i++) {
            const shouldDeliver =
                frequency === 'DAILY' ||
                (frequency === 'ALTERNATE' && i % 2 === 0) ||
                (frequency === 'WEEKLY' && i % 7 === 0)

            if (shouldDeliver) {
                schedules.push({
                    subscriptionId: subscription.id,
                    date: new Date(current),
                    status: 'SCHEDULED',
                    quantity,
                })
            }
            current.setDate(current.getDate() + 1)
        }

        if (schedules.length > 0) {
            await prisma.subscriptionSchedule.createMany({ data: schedules })
        }

        // Audit log
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'SUBSCRIPTION_CREATED',
                entity: 'Subscription',
                entityId: subscription.id,
                details: `${frequency} subscription for ${variant.name} x${quantity}`,
            }
        })

        // Send confirmation email
        const userDetails = await prisma.user.findUnique({ where: { id: user.id } })
        if (userDetails?.email) {
            await sendSubscriptionConfirmation(userDetails.email, {
                name: userDetails.name || 'Customer',
                variant: subscription.variant.name,
                frequency,
                quantity,
                pricePerUnit: variant.price,
                startDate: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                address: `${subscription.address.line1}, ${subscription.address.city} - ${subscription.address.pincode}`,
            })
        }

        return successResponse(subscription, 201)
    } catch (error) {
        console.error('Subscription POST error:', error)
        return errorResponse('Failed to create subscription', 500)
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const body = await request.json()
        const { subscriptionId, action, date, quantity, addressId } = body

        const subscription = await prisma.subscription.findFirst({
            where: { id: subscriptionId, userId: user.id }
        })
        if (!subscription) return errorResponse('Subscription not found', 404)

        if (action === 'pause') {
            await prisma.subscription.update({
                where: { id: subscriptionId },
                data: { status: 'PAUSED', pausedAt: new Date() }
            })
            // Send pause email
            const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { variant: true } })
            const usr = await prisma.user.findUnique({ where: { id: user.id } })
            if (usr?.email && sub) {
                await sendSubscriptionStatusEmail(usr.email, { name: usr.name || 'Customer', action: 'paused', variant: sub.variant.name })
            }
            return successResponse({ message: 'Subscription paused' })
        }

        if (action === 'resume') {
            await prisma.subscription.update({
                where: { id: subscriptionId },
                data: { status: 'ACTIVE', pausedAt: null, resumeAt: null }
            })
            const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { variant: true } })
            const usr = await prisma.user.findUnique({ where: { id: user.id } })
            if (usr?.email && sub) {
                await sendSubscriptionStatusEmail(usr.email, { name: usr.name || 'Customer', action: 'resumed', variant: sub.variant.name })
            }
            return successResponse({ message: 'Subscription resumed' })
        }

        if (action === 'skip' && date) {
            const skipDate = new Date(date)
            await prisma.subscriptionSchedule.updateMany({
                where: {
                    subscriptionId,
                    date: skipDate,
                    status: 'SCHEDULED',
                },
                data: { status: 'SKIPPED' }
            })
            return successResponse({ message: `Delivery skipped for ${date}` })
        }

        if (action === 'update-quantity' && quantity) {
            await prisma.subscription.update({
                where: { id: subscriptionId },
                data: { quantity }
            })
            // Update future schedules
            await prisma.subscriptionSchedule.updateMany({
                where: {
                    subscriptionId,
                    date: { gte: new Date() },
                    status: 'SCHEDULED',
                },
                data: { quantity }
            })
            return successResponse({ message: 'Quantity updated' })
        }

        if (action === 'update-address' && addressId) {
            const address = await prisma.address.findFirst({
                where: { id: addressId, userId: user.id }
            })
            if (!address) return errorResponse('Address not found', 404)

            await prisma.subscription.update({
                where: { id: subscriptionId },
                data: { addressId }
            })
            return successResponse({ message: 'Address updated' })
        }

        if (action === 'cancel') {
            await prisma.subscription.update({
                where: { id: subscriptionId },
                data: { status: 'CANCELLED' }
            })
            const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { variant: true } })
            const usr = await prisma.user.findUnique({ where: { id: user.id } })
            if (usr?.email && sub) {
                await sendSubscriptionStatusEmail(usr.email, { name: usr.name || 'Customer', action: 'cancelled', variant: sub.variant.name })
            }
            return successResponse({ message: 'Subscription cancelled' })
        }

        return errorResponse('Invalid action', 400)
    } catch (error) {
        console.error('Subscription PATCH error:', error)
        return errorResponse('Failed to update subscription', 500)
    }
}
