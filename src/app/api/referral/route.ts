import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { mlToLitreString } from '@/lib/referral'

// ─── Types ────────────────────────────────────────────────────

interface ReferralRewardRow {
    id: string
    referredUserId: string
    totalDeliveredMl: number
    rewardGranted: boolean
    rewardMl: number
    rewardedAt: Date | null
    revokedAt: Date | null
    revokedReason: string | null
    referralRiskScore: number
    flaggedAt: Date | null
    referredUser: {
        email: string
        name: string | null
        createdAt: Date
    }
}

// GET: Fetch referral data for authenticated user
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        // B2C-only: Referral system is exclusively for individual customers
        if (user.role?.toUpperCase() !== 'B2C') {
            return errorResponse('Referral system is only available for B2C customers', 403)
        }

        // Fetch user's referral code + wallet
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                referralCode: true,
                referredById: true,
                wallet: { select: { milkCreditMl: true } },
            }
        })

        if (!userData) return errorResponse('User not found', 404)

        // Load referral config
        const config = await prisma.referralConfig.findFirst({ orderBy: { createdAt: 'desc' } })
        const thresholdMl = config?.thresholdMl ?? 5000
        const rewardMl = config?.rewardMl ?? 500
        const isActive = config?.isActive ?? true

        // Fetch referrals given by this user
        const referrals = await prisma.referralReward.findMany({
            where: { referrerId: user.id },
            include: {
                referredUser: {
                    select: { email: true, name: true, createdAt: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Calculate stats — all server-side
        const totalReferred = referrals.length
        const rewarded = referrals.filter((r: ReferralRewardRow) => r.rewardGranted && !r.revokedAt).length
        const totalEarnedMl = referrals
            .filter((r: ReferralRewardRow) => r.rewardGranted && !r.revokedAt)
            .reduce((sum: number, r: ReferralRewardRow) => sum + r.rewardMl, 0)
        const pending = referrals.filter((r: ReferralRewardRow) => !r.rewardGranted && !r.revokedAt).length

        // Map referrals with masked emails and progress
        const referralList = referrals.map((r: ReferralRewardRow) => {
            const email = r.referredUser.email
            const masked = email.length > 4
                ? email.substring(0, 2) + '***' + email.substring(email.indexOf('@'))
                : '***@***'

            return {
                id: r.id,
                maskedEmail: masked,
                name: r.referredUser.name || '',
                signedUpAt: r.referredUser.createdAt,
                deliveredMl: r.totalDeliveredMl,
                totalDeliveredMl: r.totalDeliveredMl,
                progressPercent: Math.min(100, Math.round((r.totalDeliveredMl / thresholdMl) * 100)),
                progressDisplay: `${mlToLitreString(r.totalDeliveredMl)} / ${mlToLitreString(thresholdMl)}`,
                rewardGranted: r.rewardGranted,
                revoked: !!r.revokedAt,
                rewardMl: r.rewardMl,
                rewardedAt: r.rewardedAt || null,
                revokedAt: r.revokedAt || null,
                revokedReason: r.revokedReason || '',
                status: r.revokedAt ? 'REVOKED' : r.rewardGranted ? 'REWARDED' : 'PENDING',
            }
        })

        // Fetch user's own referral status (if they were referred)
        let myReferralStatus = null
        if (userData.referredById) {
            const myReward = await prisma.referralReward.findUnique({
                where: { referredUserId: user.id }
            })
            if (myReward) {
                myReferralStatus = {
                    totalDeliveredMl: myReward.totalDeliveredMl,
                    progressPercent: Math.min(100, Math.round((myReward.totalDeliveredMl / thresholdMl) * 100)),
                    progressDisplay: `${mlToLitreString(myReward.totalDeliveredMl)} / ${mlToLitreString(thresholdMl)}`,
                    rewardGranted: myReward.rewardGranted,
                    revokedAt: myReward.revokedAt,
                }
            }
        }

        return successResponse({
            referralCode: userData.referralCode || '',
            milkCreditMl: userData.wallet?.milkCreditMl ?? 0,
            milkCreditDisplay: mlToLitreString(userData.wallet?.milkCreditMl ?? 0),
            totalEarnedMl,
            totalEarnedLitres: mlToLitreString(totalEarnedMl),
            successfulReferrals: rewarded,
            pendingReferrals: pending,
            config: {
                thresholdMl,
                rewardMl,
                thresholdDisplay: mlToLitreString(thresholdMl),
                rewardDisplay: mlToLitreString(rewardMl),
                isActive,
            },
            stats: {
                totalReferred,
                rewarded,
                totalEarnedMl,
                totalEarnedDisplay: mlToLitreString(totalEarnedMl),
                pending,
            },
            referrals: referralList,
            myReferralStatus,
        })
    } catch (error) {
        console.error('Referral GET error:', error)
        return errorResponse('Failed to fetch referral data', 500)
    }
}
