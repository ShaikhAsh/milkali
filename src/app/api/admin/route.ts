import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getAuthUser, requireRole } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { awardPointsForDelivery, adminAdjustPoints } from '@/lib/loyalty'

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user || !requireRole(user.role, ['ADMIN'])) {
            return errorResponse('Unauthorized', 403)
        }

        const { searchParams } = new URL(request.url)
        const section = searchParams.get('section') || 'overview'

        if (section === 'overview') {
            const [totalUsers, totalOrders, activeSubscriptions, totalRevenue, recentOrders, pendingB2B] = await Promise.all([
                prisma.user.count(),
                prisma.order.count(),
                prisma.subscription.count({ where: { status: 'ACTIVE' } }),
                prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'PAID' } }),
                prisma.order.findMany({
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: { user: true, items: { include: { variant: true } } }
                }),
                prisma.b2BProfile.count({ where: { isApproved: false } }),
            ])

            return successResponse({
                stats: {
                    totalUsers,
                    totalOrders,
                    activeSubscriptions,
                    totalRevenue: totalRevenue._sum.total || 0,
                    pendingB2B,
                },
                recentOrders,
            })
        }

        if (section === 'users') {
            const role = searchParams.get('role')
            const where: Record<string, unknown> = {}
            if (role) where.role = role

            const users = await prisma.user.findMany({
                where,
                include: { wallet: true, b2bProfile: true, _count: { select: { orders: true, subscriptions: true } } },
                orderBy: { createdAt: 'desc' },
                take: 100,
            })
            return successResponse(users)
        }

        if (section === 'subscriptions') {
            const status = searchParams.get('status')
            const where: Record<string, unknown> = {}
            if (status) where.status = status

            const subscriptions = await prisma.subscription.findMany({
                where,
                include: {
                    user: true,
                    variant: { include: { product: true } },
                    address: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            })
            return successResponse(subscriptions)
        }

        if (section === 'orders') {
            const status = searchParams.get('status')
            const where: Record<string, unknown> = {}
            if (status) where.status = status

            const orders = await prisma.order.findMany({
                where,
                include: {
                    user: true,
                    items: { include: { variant: { include: { product: true } } } },
                    address: true,
                    delivery: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
            })
            return successResponse(orders)
        }

        if (section === 'b2b') {
            const profiles = await prisma.b2BProfile.findMany({
                include: { user: true },
                orderBy: { createdAt: 'desc' },
                take: 100,
            })
            return successResponse(profiles)
        }

        if (section === 'coupons') {
            const coupons = await prisma.coupon.findMany({
                orderBy: { createdAt: 'desc' },
                take: 100,
            })
            return successResponse(coupons)
        }

        if (section === 'service-areas') {
            const areas = await prisma.serviceableArea.findMany({
                orderBy: { pincode: 'asc' },
                take: 100,
            })
            return successResponse(areas)
        }

        if (section === 'deliveries') {
            const deliveries = await prisma.deliverySchedule.findMany({
                include: {
                    order: {
                        include: {
                            user: true,
                            address: true,
                            items: { include: { variant: true } }
                        }
                    },
                    deliveryPartner: true,
                },
                orderBy: { scheduledDate: 'desc' },
                take: 100,
            })
            return successResponse(deliveries)
        }

        if (section === 'audit-logs') {
            const logs = await prisma.auditLog.findMany({
                include: { user: true },
                orderBy: { createdAt: 'desc' },
                take: 200,
            })
            return successResponse(logs)
        }

        if (section === 'inquiries') {
            const inquiries = await prisma.contactInquiry.findMany({
                orderBy: { createdAt: 'desc' },
                take: 100,
            })
            return successResponse(inquiries)
        }

        return errorResponse('Invalid section', 400)
    } catch (error) {
        console.error('Admin GET error:', error)
        return errorResponse('Failed to fetch admin data', 500)
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user || !requireRole(user.role, ['ADMIN'])) {
            return errorResponse('Unauthorized', 403)
        }

        const body = await request.json()
        const { action } = body

        if (action === 'approve-b2b') {
            const { profileId, creditLimit, negotiatedPrice } = body
            await prisma.b2BProfile.update({
                where: { id: profileId },
                data: {
                    isApproved: true,
                    approvedAt: new Date(),
                    creditLimit: creditLimit || 50000,
                    negotiatedPrice: negotiatedPrice || null,
                }
            })
            return successResponse({ message: 'B2B profile approved' })
        }

        if (action === 'create-coupon') {
            const coupon = await prisma.coupon.create({
                data: {
                    code: body.code.toUpperCase(),
                    description: body.description,
                    type: body.type,
                    value: body.value,
                    minOrder: body.minOrder || 0,
                    maxDiscount: body.maxDiscount,
                    usageLimit: body.usageLimit,
                    validFrom: new Date(body.validFrom),
                    validUntil: new Date(body.validUntil),
                }
            })
            return successResponse(coupon, 201)
        }

        if (action === 'add-service-area') {
            const area = await prisma.serviceableArea.create({
                data: {
                    pincode: body.pincode,
                    area: body.area,
                    isActive: body.isActive !== false,
                }
            })
            return successResponse(area, 201)
        }

        if (action === 'toggle-service-area') {
            await prisma.serviceableArea.update({
                where: { id: body.areaId },
                data: { isActive: body.isActive }
            })
            return successResponse({ message: 'Service area updated' })
        }

        if (action === 'update-user-role') {
            await prisma.user.update({
                where: { id: body.userId },
                data: { role: body.role }
            })
            return successResponse({ message: 'User role updated' })
        }

        if (action === 'update-order-status') {
            await prisma.order.update({
                where: { id: body.orderId },
                data: { status: body.status }
            })
            return successResponse({ message: 'Order status updated' })
        }

        // ─── Update delivery status (with loyalty point awarding) ───
        if (action === 'update-delivery-status') {
            const { deliveryId, status: newStatus } = body
            if (!deliveryId || !newStatus) return errorResponse('deliveryId and status required', 400)

            const delivery = await prisma.deliverySchedule.findUnique({
                where: { id: deliveryId },
                include: { order: true },
            })
            if (!delivery) return errorResponse('Delivery not found', 404)

            let loyaltyResult = null

            if (newStatus === 'DELIVERED') {
                // Atomic: update delivery + order status + award loyalty points
                await prisma.$transaction(async (tx) => {
                    await tx.deliverySchedule.update({
                        where: { id: deliveryId },
                        data: { status: 'DELIVERED', deliveredAt: new Date() },
                    })
                    await tx.order.update({
                        where: { id: delivery.orderId },
                        data: { status: 'DELIVERED' },
                    })
                    // Award loyalty points (idempotent — safe to call multiple times)
                    loyaltyResult = await awardPointsForDelivery(delivery.orderId, tx)
                })
            } else {
                await prisma.deliverySchedule.update({
                    where: { id: deliveryId },
                    data: {
                        status: newStatus,
                        ...(newStatus === 'FAILED' && body.failureReason ? { failureReason: body.failureReason } : {}),
                    },
                })
            }

            return successResponse({
                message: `Delivery status updated to ${newStatus}`,
                loyalty: loyaltyResult,
            })
        }

        // ─── Admin: Manual loyalty point adjustment ───
        if (action === 'admin-adjust-loyalty') {
            const { userId: targetUserId, points, description: desc } = body
            if (!targetUserId || typeof points !== 'number' || !desc) {
                return errorResponse('userId, points (number), and description required', 400)
            }

            const result = await prisma.$transaction(async (tx) => {
                return adminAdjustPoints(targetUserId, points, desc, tx)
            })

            if (!result.success) return errorResponse(result.reason || 'Failed', 400)
            return successResponse({ message: `${points > 0 ? 'Credited' : 'Debited'} ${Math.abs(points)} loyalty points` })
        }

        if (action === 'update-coupon') {
            const { couponId, ...updates } = body
            if (!couponId) return errorResponse('couponId required', 400)
            const data: Record<string, unknown> = {}
            if (updates.code !== undefined) data.code = updates.code.toUpperCase()
            if (updates.description !== undefined) data.description = updates.description
            if (updates.type !== undefined) data.type = updates.type
            if (updates.value !== undefined) data.value = updates.value
            if (updates.minOrder !== undefined) data.minOrder = updates.minOrder
            if (updates.maxDiscount !== undefined) data.maxDiscount = updates.maxDiscount
            if (updates.usageLimit !== undefined) data.usageLimit = updates.usageLimit
            if (updates.validFrom !== undefined) data.validFrom = new Date(updates.validFrom)
            if (updates.validUntil !== undefined) data.validUntil = new Date(updates.validUntil)
            if (updates.isActive !== undefined) data.isActive = updates.isActive
            const coupon = await prisma.coupon.update({ where: { id: couponId }, data })
            return successResponse(coupon)
        }

        if (action === 'delete-coupon') {
            const { couponId } = body
            if (!couponId) return errorResponse('couponId required', 400)
            // Delete usages first, then coupon
            await prisma.couponUsage.deleteMany({ where: { couponId } })
            await prisma.coupon.delete({ where: { id: couponId } })
            return successResponse({ message: 'Coupon deleted' })
        }

        return errorResponse('Invalid action', 400)
    } catch (error) {
        console.error('Admin POST error:', error)
        return errorResponse('Failed to process admin action', 500)
    }
}
