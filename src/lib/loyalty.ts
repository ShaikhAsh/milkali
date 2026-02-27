// ═══════════════════════════════════════════════════════════════
// Loyalty Points Service — Ledger-style, idempotent
// ═══════════════════════════════════════════════════════════════
//
// Business rules:
//   • 1 litre delivered → 2 points
//   • 1 point = ₹1 equivalent value
//   • Only B2C users earn points
//   • Points awarded ONLY after delivery status = DELIVERED
//   • Points reversed on cancellation/refund post-delivery
//   • Idempotency enforced at DB level (unique constraint)
// ═══════════════════════════════════════════════════════════════

import prisma from './db'

// Type for Prisma transaction client — matches what $transaction provides
type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

const POINTS_PER_LITRE = 2

/**
 * Calculate total millilitres from order items.
 * Only counts items where the variant unit is 'ml'.
 * Formula: quantity × parseInt(variant.size) for each item.
 */
function calculateOrderMl(items: { quantity: number; variant: { size: string; unit: string } }[]): number {
    let totalMl = 0
    for (const item of items) {
        if (item.variant.unit.toLowerCase() === 'ml') {
            const sizeMl = parseInt(item.variant.size, 10)
            if (!isNaN(sizeMl)) {
                totalMl += item.quantity * sizeMl
            }
        }
    }
    return totalMl
}

/**
 * Award loyalty points for a delivered order.
 * 
 * IDEMPOTENT: If points were already credited for this order,
 * the unique constraint (loyaltyAccountId, orderId, type) will
 * prevent duplicate insertion — caught gracefully.
 * 
 * B2C ONLY: Skips if user role is not B2C.
 */
export async function awardPointsForDelivery(
    orderId: string,
    tx: TxClient
): Promise<{ awarded: boolean; points?: number; reason?: string }> {
    // Fetch order with user + items + variants
    const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            items: { include: { variant: true } },
        },
    })

    if (!order) return { awarded: false, reason: 'Order not found' }

    // B2C guard — only B2C users earn points
    if (order.user.role !== 'B2C') {
        return { awarded: false, reason: `User role ${order.user.role} excluded` }
    }

    // Calculate ml and points
    const totalMl = calculateOrderMl(order.items)
    const totalLitres = totalMl / 1000
    const points = Math.floor(totalLitres * POINTS_PER_LITRE)

    if (points <= 0) {
        return { awarded: false, reason: 'Order has 0 qualifying litres' }
    }

    // Get or create loyalty account
    let account = await tx.loyaltyAccount.findUnique({
        where: { userId: order.userId },
    })
    if (!account) {
        account = await tx.loyaltyAccount.create({
            data: { userId: order.userId },
        })
    }

    // Idempotency: try to create CREDIT transaction
    // If it already exists, the unique constraint will throw
    try {
        const newBalance = account.balance + points

        await tx.loyaltyTransaction.create({
            data: {
                loyaltyAccountId: account.id,
                type: 'CREDIT',
                points,
                balanceAfter: newBalance,
                orderId,
                description: `Earned ${points} points for order delivery (${totalLitres.toFixed(1)}L)`,
            },
        })

        await tx.loyaltyAccount.update({
            where: { id: account.id },
            data: {
                balance: { increment: points },
                totalEarned: { increment: points },
            },
        })

        return { awarded: true, points }
    } catch (err: unknown) {
        // Unique constraint violation → already credited
        if (
            err &&
            typeof err === 'object' &&
            'code' in err &&
            (err as { code: string }).code === 'P2002'
        ) {
            return { awarded: false, reason: 'Points already credited for this order' }
        }
        throw err // Re-throw unexpected errors
    }
}

/**
 * Reverse loyalty points for a cancelled/refunded order.
 * 
 * IDEMPOTENT: If reversal already exists for this order,
 * the unique constraint prevents duplicate reversal.
 * 
 * NO-OP if no CREDIT exists for this order.
 */
export async function reversePointsForOrder(
    orderId: string,
    tx: TxClient
): Promise<{ reversed: boolean; points?: number; reason?: string }> {
    // Find the original CREDIT transaction for this order
    const creditTx = await tx.loyaltyTransaction.findFirst({
        where: {
            orderId,
            type: 'CREDIT',
        },
        include: { loyaltyAccount: true },
    })

    if (!creditTx) {
        return { reversed: false, reason: 'No loyalty credit found for this order' }
    }

    const account = creditTx.loyaltyAccount
    const points = creditTx.points

    // Idempotency: try to create REVERSAL transaction
    try {
        const newBalance = Math.max(0, account.balance - points)

        await tx.loyaltyTransaction.create({
            data: {
                loyaltyAccountId: account.id,
                type: 'REVERSAL',
                points,
                balanceAfter: newBalance,
                orderId,
                description: `Reversed ${points} points — order cancelled/refunded`,
            },
        })

        await tx.loyaltyAccount.update({
            where: { id: account.id },
            data: {
                balance: newBalance,
                totalReversed: { increment: points },
            },
        })

        return { reversed: true, points }
    } catch (err: unknown) {
        if (
            err &&
            typeof err === 'object' &&
            'code' in err &&
            (err as { code: string }).code === 'P2002'
        ) {
            return { reversed: false, reason: 'Points already reversed for this order' }
        }
        throw err
    }
}

/**
 * Redeem loyalty points (stub — ready for future implementation).
 */
export async function redeemPoints(
    userId: string,
    points: number,
    tx: TxClient
): Promise<{ redeemed: boolean; reason?: string }> {
    if (points <= 0) return { redeemed: false, reason: 'Points must be positive' }

    const account = await tx.loyaltyAccount.findUnique({
        where: { userId },
    })

    if (!account) return { redeemed: false, reason: 'No loyalty account found' }
    if (account.balance < points) return { redeemed: false, reason: 'Insufficient points balance' }

    const newBalance = account.balance - points

    await tx.loyaltyTransaction.create({
        data: {
            loyaltyAccountId: account.id,
            type: 'REDEMPTION',
            points,
            balanceAfter: newBalance,
            description: `Redeemed ${points} points (₹${points} value)`,
        },
    })

    await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
            balance: { decrement: points },
            totalRedeemed: { increment: points },
        },
    })

    return { redeemed: true }
}

/**
 * Admin manual point adjustment.
 */
export async function adminAdjustPoints(
    userId: string,
    points: number,
    description: string,
    tx: TxClient
): Promise<{ success: boolean; reason?: string }> {
    if (points === 0) return { success: false, reason: 'Points cannot be zero' }

    let account = await tx.loyaltyAccount.findUnique({
        where: { userId },
    })

    if (!account) {
        account = await tx.loyaltyAccount.create({
            data: { userId },
        })
    }

    const type = points > 0 ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT'
    const absPoints = Math.abs(points)
    const newBalance = type === 'ADMIN_CREDIT'
        ? account.balance + absPoints
        : Math.max(0, account.balance - absPoints)

    await tx.loyaltyTransaction.create({
        data: {
            loyaltyAccountId: account.id,
            type,
            points: absPoints,
            balanceAfter: newBalance,
            description,
        },
    })

    const updateData: Record<string, unknown> = { balance: newBalance }
    if (type === 'ADMIN_CREDIT') updateData.totalEarned = { increment: absPoints }

    await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: updateData,
    })

    return { success: true }
}
