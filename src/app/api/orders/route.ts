import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createOrderSchema } from '@/lib/validations'
import { successResponse, errorResponse, generateOrderNumber } from '@/lib/utils'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { checkAndGrantReferralReward, recalculateAndMaybeRevoke, mlToLitreString } from '@/lib/referral'
import { reversePointsForOrder } from '@/lib/loyalty'
import { orderLimiter } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)
        const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

        const where: Record<string, unknown> = { userId: user.id }
        if (status) where.status = status

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: {
                    select: {
                        id: true,
                        quantity: true,
                        price: true,
                        total: true,
                        variant: {
                            select: { name: true, size: true, product: { select: { name: true } } }
                        },
                    },
                },
                address: {
                    select: { line1: true, city: true, pincode: true },
                },
                delivery: {
                    select: { status: true, scheduledDate: true, deliveredAt: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        })

        return successResponse(orders)
    } catch (error) {
        console.error('Orders GET error:', error)
        return errorResponse('Failed to fetch orders', 500)
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const body = await request.json()
        const parsed = createOrderSchema.safeParse(body)
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message)

        // Rate limit order creation
        const { success: rlOk } = await orderLimiter.limit(user.id)
        if (!rlOk) return errorResponse('Too many requests. Please try again later.', 429)

        const { addressId, paymentMethod, deliverySlot, couponCode, notes } = parsed.data

        // Validate address & Mumbai PIN
        const address = await prisma.address.findFirst({
            where: { id: addressId, userId: user.id }
        })
        if (!address) return errorResponse('Address not found', 404)

        const serviceArea = await prisma.serviceableArea.findFirst({
            where: { pincode: address.pincode, isActive: true }
        })
        if (!serviceArea) {
            return errorResponse('Sorry, we currently deliver only in Mumbai. Your area PIN code is not serviceable.', 400)
        }

        // NOTE: Cart is now read INSIDE the transaction (see below)
        // to prevent double-order race condition.

        const deliveryDate = new Date()
        deliveryDate.setDate(deliveryDate.getDate() + 1)

        // SECURITY: Wrap everything in a transaction to prevent race conditions
        const txResult = await prisma.$transaction(async (tx) => {
            // ─── DOUBLE-ORDER GATE: Read + delete cart inside Tx ───
            const cart = await tx.cart.findUnique({
                where: { userId: user.id },
                include: { items: { include: { variant: true } } }
            })
            if (!cart || cart.items.length === 0) {
                throw new Error('CART_EMPTY')
            }

            // Calculate totals inside Tx (prices are live)
            let subtotal = 0
            const orderItems = cart.items.map(item => {
                const itemTotal = item.variant.price * item.quantity
                subtotal += itemTotal
                return {
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: item.variant.price,
                    total: itemTotal,
                }
            })

            // ─── Coupon validation (inside Tx so subtotal is available) ───
            let discount = 0
            let couponId: string | null = null
            if (couponCode) {
                const coupon = await tx.coupon.findFirst({
                    where: {
                        code: couponCode.toUpperCase(),
                        isActive: true,
                        validFrom: { lte: new Date() },
                        validUntil: { gte: new Date() },
                    }
                })
                if (!coupon) throw new Error('Invalid or expired coupon')

                if (subtotal < coupon.minOrder) {
                    throw new Error(`Minimum order of ₹${coupon.minOrder} required for this coupon`)
                }

                if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                    throw new Error('Coupon usage limit reached')
                }

                const alreadyUsed = await tx.couponUsage.findFirst({
                    where: { couponId: coupon.id, userId: user.id }
                })
                if (alreadyUsed) {
                    throw new Error('You have already used this coupon')
                }

                if (coupon.type === 'PERCENTAGE') {
                    discount = (subtotal * coupon.value) / 100
                    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount)
                } else {
                    discount = coupon.value
                }
                couponId = coupon.id
            }

            const total = subtotal - discount

            // ─── IDEMPOTENCY GATE: Delete cart items first ───
            const deleted = await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
            if (deleted.count === 0) {
                throw new Error('CART_EMPTY')
            }

            // ─── Inventory: Atomic stock decrement ───
            for (const item of orderItems) {
                const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } })
                if (!variant) throw new Error('Product variant not found')
                if (variant.stock === -1) continue // Unlimited → skip

                const result = await tx.productVariant.updateMany({
                    where: {
                        id: item.variantId,
                        stock: { gte: item.quantity },
                    },
                    data: { stock: { decrement: item.quantity } }
                })
                if (result.count === 0) {
                    throw new Error(`INSUFFICIENT_STOCK:${variant.name} has only ${variant.stock} units available`)
                }
            }

            // Handle wallet payment atomically — CONDITIONAL UPDATE (race-safe)
            if (paymentMethod === 'WALLET') {
                const result = await tx.wallet.updateMany({
                    where: {
                        userId: user.id,
                        balance: { gte: total },
                    },
                    data: {
                        balance: { decrement: total },
                    },
                })
                if (result.count === 0) {
                    throw new Error(`INSUFFICIENT_BALANCE`)
                }

                const wallet = await tx.wallet.findUnique({ where: { userId: user.id } })
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet!.id,
                        type: 'DEBIT',
                        amount: total,
                        description: `Order payment`,
                    }
                })
            }

            // Create order
            const newOrder = await tx.order.create({
                data: {
                    userId: user.id,
                    addressId,
                    orderNumber: generateOrderNumber(),
                    status: 'CONFIRMED',
                    subtotal,
                    discount,
                    total,
                    paymentMethod,
                    paymentStatus: paymentMethod === 'WALLET' ? 'PAID' : 'PENDING',
                    couponId,
                    deliveryDate,
                    notes,
                    items: { create: orderItems },
                },
                include: {
                    items: { include: { variant: { include: { product: true } } } },
                    address: true,
                }
            })

            // Track coupon usage per user
            if (couponId) {
                await tx.coupon.update({
                    where: { id: couponId },
                    data: { usedCount: { increment: 1 } }
                })
                await tx.couponUsage.create({
                    data: { couponId, userId: user.id, orderId: newOrder.id }
                })
            }

            // Create delivery schedule
            await tx.deliverySchedule.create({
                data: {
                    orderId: newOrder.id,
                    scheduledDate: deliveryDate,
                    scheduledSlot: deliverySlot || 'morning',
                    status: 'PENDING',
                }
            })

            // Cart items already deleted by idempotency gate above

            // ─── Referral: Check and grant reward inside this Tx ───
            const referralResult = await checkAndGrantReferralReward(user.id, tx)

            return { order: newOrder, referralResult }
        })

        const { order, referralResult } = txResult

        // Audit log (outside transaction - non-critical)
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'ORDER_CREATED',
                entity: 'Order',
                entityId: order.id,
                details: `Order ${order.orderNumber} created. Total: ₹${order.total}`,
            }
        })

        // Referral reward audit (if granted)
        if (referralResult?.rewarded) {
            await prisma.auditLog.create({
                data: {
                    userId: referralResult.referrerId,
                    action: 'REFERRAL_REWARD_GRANTED',
                    entity: 'ReferralReward',
                    details: `Reward ${mlToLitreString(referralResult.rewardMl)} milk credit granted. Referred user ${user.id} crossed ${mlToLitreString(referralResult.totalDeliveredMl)} threshold.`,
                }
            }).catch(() => { })
        }

        // Send order confirmation email
        if (user.email) {
            const items = order.items.map((item: { variant: { product?: { name: string } | null; name: string }; quantity: number; price: number }) => ({
                name: item.variant.product?.name || item.variant.name,
                quantity: item.quantity,
                price: item.price,
            }))
            await sendOrderConfirmationEmail(user.email, {
                name: user.name || 'Customer',
                orderNumber: order.orderNumber,
                items,
                total: order.total,
                deliveryDate: deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            })
        }

        return successResponse({ order, referralRewardMl: referralResult?.rewarded ? referralResult.rewardMl : undefined }, 201)
    } catch (error) {
        if (error instanceof Error && error.message.includes('INSUFFICIENT_BALANCE')) {
            return errorResponse('Insufficient wallet balance', 400)
        }
        if (error instanceof Error && error.message.startsWith('INSUFFICIENT_STOCK:')) {
            return errorResponse(error.message.replace('INSUFFICIENT_STOCK:', ''), 400)
        }
        console.error('Orders POST error:', error)
        return errorResponse('Failed to create order', 500)
    }
}

// PATCH: Cancel order
export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const body = await request.json()
        const { orderId, action } = body

        if (action === 'cancel') {
            const order = await prisma.order.findFirst({
                where: { id: orderId, userId: user.id }
            })
            if (!order) return errorResponse('Order not found', 404)
            if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
                return errorResponse('Order cannot be cancelled at this stage', 400)
            }

            // Refund to wallet if paid via wallet
            await prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: 'CANCELLED', paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus }
                })

                if (order.paymentMethod === 'WALLET' && order.paymentStatus === 'PAID') {
                    const wallet = await tx.wallet.findUnique({ where: { userId: user.id } })
                    if (wallet) {
                        await tx.wallet.update({
                            where: { userId: user.id },
                            data: { balance: { increment: order.total } }
                        })
                        await tx.walletTransaction.create({
                            data: {
                                walletId: wallet.id,
                                type: 'CREDIT',
                                amount: order.total,
                                description: `Refund for cancelled order ${order.orderNumber}`,
                            }
                        })
                    }
                }

                // ─── Referral: Recalculate ml + maybe revoke after cancellation ───
                await recalculateAndMaybeRevoke(user.id, tx)

                // ─── Loyalty: Reverse points if they were awarded for this order ───
                await reversePointsForOrder(orderId, tx)
            })

            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'ORDER_CANCELLED',
                    entity: 'Order',
                    entityId: orderId,
                    details: `Order ${order.orderNumber} cancelled. Refund: ₹${order.total}`,
                }
            })

            return successResponse({ message: 'Order cancelled successfully' })
        }

        return errorResponse('Invalid action', 400)
    } catch (error) {
        console.error('Orders PATCH error:', error)
        return errorResponse('Failed to update order', 500)
    }
}
