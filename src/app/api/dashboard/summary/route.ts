import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════
// Dashboard Summary BFF — Single endpoint for all dashboard data
// ═══════════════════════════════════════════════════════════════
// Replaces 5 separate API calls with 1 optimised query.
// Uses Promise.all for parallel DB fetches within a single
// connection pool checkout.
// ═══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const isB2C = user.role.toUpperCase() === 'B2C'

        // Parallel fetch — all independent queries run concurrently
        const [wallet, recentOrders, subscriptions, referralStats, loyaltyAccount] =
            await Promise.all([
                // 1. Wallet balance only
                prisma.wallet.findUnique({
                    where: { userId: user.id },
                    select: { balance: true, milkCreditMl: true },
                }),

                // 2. Last 5 orders — minimal fields
                prisma.order.findMany({
                    where: { userId: user.id },
                    select: {
                        id: true,
                        orderNumber: true,
                        total: true,
                        status: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                }),

                // 3. Active subscriptions — minimal
                prisma.subscription.findMany({
                    where: { userId: user.id },
                    select: {
                        id: true,
                        status: true,
                        frequency: true,
                        quantity: true,
                    },
                    orderBy: { createdAt: 'desc' },
                }),

                // 4. Referral stats (B2C only)
                isB2C
                    ? prisma.referralReward.findMany({
                        where: { referrerId: user.id },
                        select: {
                            rewardGranted: true,
                            rewardMl: true,
                            revokedAt: true,
                        },
                    })
                    : Promise.resolve(null),

                // 5. Loyalty (B2C only)
                isB2C
                    ? prisma.loyaltyAccount.findUnique({
                        where: { userId: user.id },
                        select: {
                            balance: true,
                            totalEarned: true,
                        },
                    })
                    : Promise.resolve(null),
            ])

        // Compute referral summary server-side
        let referralSummary = null
        if (referralStats) {
            const rewarded = referralStats.filter(r => r.rewardGranted && !r.revokedAt)
            const pending = referralStats.filter(r => !r.rewardGranted && !r.revokedAt)
            const totalEarnedMl = rewarded.reduce((sum, r) => sum + r.rewardMl, 0)

            // Fetch referral code
            const userData = await prisma.user.findUnique({
                where: { id: user.id },
                select: { referralCode: true },
            })

            referralSummary = {
                referralCode: userData?.referralCode || '',
                totalEarnedLitres: `${(totalEarnedMl / 1000).toFixed(1)}L`,
                successfulReferrals: rewarded.length,
                pendingReferrals: pending.length,
            }
        }

        return successResponse({
            wallet: wallet
                ? { balance: Number(wallet.balance), milkCreditMl: wallet.milkCreditMl }
                : { balance: 0, milkCreditMl: 0 },
            recentOrders,
            subscriptions,
            referralSummary,
            loyaltyPoints: loyaltyAccount
                ? { balance: loyaltyAccount.balance, totalEarned: loyaltyAccount.totalEarned }
                : null,
        })
    } catch (error) {
        console.error('Dashboard summary error:', error)
        return errorResponse('Failed to fetch dashboard data', 500)
    }
}
