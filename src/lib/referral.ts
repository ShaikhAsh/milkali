/**
 * ═══════════════════════════════════════════════════════════════
 * Referral Engine — Enterprise Production-Grade
 * ═══════════════════════════════════════════════════════════════
 *
 * ALL TRACKING IN INTEGER MILLILITRES (ml). NEVER FLOAT.
 *
 * Core rule:
 *   User A refers User B.
 *   User B accumulates ≥ thresholdMl (default 5000ml = 5L) of
 *   CONFIRMED/DELIVERED orders.
 *   User A receives rewardMl (default 500ml = 0.5L) as
 *   milkCreditMl on their wallet.
 *
 * Safety guarantees:
 *   - Integer ml: no float comparison, no rounding errors
 *   - Atomic: all checks + reward inside caller's $transaction
 *   - Idempotent: rewardGranted flag + REFERRAL_{id} unique ref
 *   - Race-safe: referredUserId @unique + reference @unique
 *   - Revocable: cancel drops below threshold → auto-revoke
 *   - Configurable: reads ReferralConfig table (no redeploy)
 *   - Anti-farming: IP rate limit + risk scoring
 */

import { Prisma } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────

type TxClient = Prisma.TransactionClient

export interface ReferralResult {
    rewarded: boolean
    revoked: boolean
    totalDeliveredMl: number
    rewardMl: number
    referrerId?: string
}

interface ReferralConfigData {
    thresholdMl: number
    rewardMl: number
    isActive: boolean
    maxPerIpDay: number
}

// ─── Defaults (used if ReferralConfig table is empty) ─────────

const DEFAULT_CONFIG: ReferralConfigData = {
    thresholdMl: 5000,  // 5L
    rewardMl: 500,      // 0.5L
    isActive: true,
    maxPerIpDay: 5,
}

// ─── Config Loader ────────────────────────────────────────────

/**
 * Load referral config from DB. Falls back to defaults.
 * Uses first row (singleton pattern).
 */
export async function getReferralConfig(tx: TxClient): Promise<ReferralConfigData> {
    const config = await tx.referralConfig.findFirst({ orderBy: { createdAt: 'desc' } })
    if (!config) return DEFAULT_CONFIG
    return {
        thresholdMl: config.thresholdMl,
        rewardMl: config.rewardMl,
        isActive: config.isActive,
        maxPerIpDay: config.maxPerIpDay,
    }
}

// ─── Referral Code Generator ─────────────────────────────────

/**
 * Generate a unique 8-char alphanumeric referral code.
 * Format: MILK + 4 random chars (e.g., MILKA7X2)
 * No I,O,0,1 to avoid visual confusion.
 */
export function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let suffix = ''
    for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `MILK${suffix}`
}

/**
 * Generate a unique referral code with DB collision retry.
 */
export async function generateUniqueReferralCode(tx: TxClient): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateReferralCode()
        const existing = await tx.user.findFirst({ where: { referralCode: code } })
        if (!existing) return code
    }
    return `MILK${Date.now().toString(36).slice(-6).toUpperCase()}`
}

// ─── Size Parser (returns INTEGER ml) ─────────────────────────

/**
 * Parse a variant size string into integer millilitres.
 * "500ml" → 500, "1L" → 1000, "250ml" → 250, "2L" → 2000
 * Returns 0 if unparseable (safe — doesn't inflate).
 */
export function parseSizeToMl(size: string): number {
    if (!size) return 0
    const normalized = size.trim().toLowerCase()

    const mlMatch = normalized.match(/^([\d.]+)\s*ml$/)
    if (mlMatch) return Math.round(parseFloat(mlMatch[1]))

    const lMatch = normalized.match(/^([\d.]+)\s*l$/)
    if (lMatch) return Math.round(parseFloat(lMatch[1]) * 1000)

    // Bare number — assume ml
    const numOnly = normalized.match(/^([\d.]+)$/)
    if (numOnly) return Math.round(parseFloat(numOnly[1]))

    return 0
}

/**
 * Calculate total delivered ml from qualifying orders.
 * Only CONFIRMED + DELIVERED status.
 */
async function calculateTotalDeliveredMl(userId: string, tx: TxClient): Promise<number> {
    const orders = await tx.order.findMany({
        where: {
            userId,
            status: { in: ['CONFIRMED', 'DELIVERED'] },
        },
        select: {
            items: {
                select: {
                    quantity: true,
                    variant: { select: { size: true } }
                }
            }
        }
    })

    let totalMl = 0
    for (const order of orders) {
        for (const item of order.items) {
            totalMl += parseSizeToMl(item.variant.size) * item.quantity
        }
    }
    return totalMl // Integer, no rounding needed
}

// ─── Core Reward Grant ────────────────────────────────────────

/**
 * Check if a referred user has crossed the ml threshold
 * and grant milkCreditMl reward to the referrer if so.
 *
 * MUST be called inside a Prisma $transaction.
 * Idempotent — safe to call multiple times.
 */
export async function checkAndGrantReferralReward(
    userId: string,
    tx: TxClient
): Promise<ReferralResult> {
    const noOp: ReferralResult = { rewarded: false, revoked: false, totalDeliveredMl: 0, rewardMl: 0 }

    // 1. Is this user referred?
    const user = await tx.user.findUnique({
        where: { id: userId },
        select: { referredById: true, isActive: true }
    })
    if (!user?.referredById) return noOp

    // 2. Find the ReferralReward row
    const reward = await tx.referralReward.findUnique({
        where: { referredUserId: userId }
    })
    if (!reward) return noOp

    // 3. Already rewarded? Return early (idempotent)
    if (reward.rewardGranted) {
        return { rewarded: false, revoked: false, totalDeliveredMl: reward.totalDeliveredMl, rewardMl: 0 }
    }

    // 4. Already revoked? Don't grant
    if (reward.revokedAt) {
        return { rewarded: false, revoked: false, totalDeliveredMl: reward.totalDeliveredMl, rewardMl: 0 }
    }

    // 5. Load config
    const config = await getReferralConfig(tx)
    if (!config.isActive) return noOp

    // 6. Calculate total delivered ml inside this transaction
    const totalDeliveredMl = await calculateTotalDeliveredMl(userId, tx)

    // 7. Update ml count on reward row
    await tx.referralReward.update({
        where: { id: reward.id },
        data: { totalDeliveredMl }
    })

    // 8. Check threshold — INTEGER comparison, no float
    if (totalDeliveredMl < config.thresholdMl) {
        return { rewarded: false, revoked: false, totalDeliveredMl, rewardMl: 0 }
    }

    // 9. Check referrer is active and has a wallet
    const referrer = await tx.user.findUnique({
        where: { id: reward.referrerId },
        select: { isActive: true, wallet: { select: { id: true } } }
    })
    if (!referrer?.isActive) {
        return { rewarded: false, revoked: false, totalDeliveredMl, rewardMl: 0 }
    }

    // 10. Credit milkCreditMl on referrer's wallet — ATOMIC
    const walletId = referrer.wallet?.id
    const reference = `REFERRAL_${reward.referredUserId}`

    if (!walletId) {
        // Create wallet if missing
        const newWallet = await tx.wallet.create({
            data: { userId: reward.referrerId, balance: 0, milkCreditMl: config.rewardMl }
        })
        await tx.walletTransaction.create({
            data: {
                walletId: newWallet.id,
                type: 'MILK_CREDIT',
                amount: 0,
                amountMl: config.rewardMl,
                description: `Referral reward: ${config.rewardMl}ml milk credit`,
                reference,
            }
        })
    } else {
        // Unique reference prevents duplicates at DB level
        await tx.wallet.update({
            where: { id: walletId },
            data: { milkCreditMl: { increment: config.rewardMl } }
        })
        await tx.walletTransaction.create({
            data: {
                walletId,
                type: 'MILK_CREDIT',
                amount: 0,
                amountMl: config.rewardMl,
                description: `Referral reward: ${config.rewardMl}ml milk credit`,
                reference,
            }
        })
        // If reference @unique is violated, the tx will throw → no double credit
    }

    // 11. Mark reward as granted
    await tx.referralReward.update({
        where: { id: reward.id },
        data: {
            rewardGranted: true,
            rewardedAt: new Date(),
            rewardMl: config.rewardMl,
            revokedAt: null,     // Clear any previous revocation
            revokedReason: null,
        }
    })

    return {
        rewarded: true,
        revoked: false,
        totalDeliveredMl,
        rewardMl: config.rewardMl,
        referrerId: reward.referrerId,
    }
}

// ─── Cancellation: Recalculate + Maybe Revoke ─────────────────

/**
 * After order cancellation: recalculate total ml.
 * If reward was granted but ml has dropped below threshold → REVOKE.
 * Revocation = subtract milkCreditMl + insert REFERRAL_REVOKE_ transaction.
 * Idempotent — checks revokedAt before revoking again.
 */
export async function recalculateAndMaybeRevoke(
    userId: string,
    tx: TxClient
): Promise<ReferralResult> {
    const noOp: ReferralResult = { rewarded: false, revoked: false, totalDeliveredMl: 0, rewardMl: 0 }

    const reward = await tx.referralReward.findUnique({
        where: { referredUserId: userId }
    })
    if (!reward) return noOp

    // Recalculate from scratch
    const totalDeliveredMl = await calculateTotalDeliveredMl(userId, tx)

    await tx.referralReward.update({
        where: { id: reward.id },
        data: { totalDeliveredMl }
    })

    // Load config for threshold check
    const config = await getReferralConfig(tx)

    // If reward was granted AND ml dropped below threshold AND not already revoked → REVOKE
    if (reward.rewardGranted && totalDeliveredMl < config.thresholdMl && !reward.revokedAt) {
        const referrerWallet = await tx.wallet.findUnique({
            where: { userId: reward.referrerId }
        })

        if (referrerWallet) {
            const revokeRef = `REFERRAL_REVOKE_${reward.referredUserId}`

            // Idempotency: check if revoke transaction already exists
            const existingRevoke = await tx.walletTransaction.findUnique({
                where: { reference: revokeRef }
            })

            if (!existingRevoke) {
                // Debit milkCreditMl (floor at 0 — never go negative)
                const debitMl = Math.min(reward.rewardMl, referrerWallet.milkCreditMl)

                await tx.wallet.update({
                    where: { id: referrerWallet.id },
                    data: { milkCreditMl: { decrement: debitMl } }
                })

                await tx.walletTransaction.create({
                    data: {
                        walletId: referrerWallet.id,
                        type: 'MILK_DEBIT',
                        amount: 0,
                        amountMl: -debitMl,
                        description: `Referral reward revoked: ${debitMl}ml milk credit removed (order cancelled)`,
                        reference: revokeRef,
                    }
                })
            }
        }

        await tx.referralReward.update({
            where: { id: reward.id },
            data: {
                revokedAt: new Date(),
                revokedReason: `Total delivered ml (${totalDeliveredMl}) dropped below threshold (${config.thresholdMl}) after order cancellation`,
                rewardGranted: false,
            }
        })

        return { rewarded: false, revoked: true, totalDeliveredMl, rewardMl: reward.rewardMl, referrerId: reward.referrerId }
    }

    return { rewarded: false, revoked: false, totalDeliveredMl, rewardMl: 0 }
}

// ─── Anti-Farming: IP Rate Limit ──────────────────────────────

/**
 * Check if an IP has exceeded the max referral signups per day.
 * Returns true if BLOCKED (should ignore referral code).
 */
export async function isReferralRateLimited(
    ip: string,
    tx: TxClient
): Promise<boolean> {
    if (!ip || ip === 'unknown') return false

    const config = await getReferralConfig(tx)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const count = await tx.referralReward.count({
        where: {
            signupIp: ip,
            createdAt: { gte: todayStart }
        }
    })

    return count >= config.maxPerIpDay
}

// ─── Anti-Farming: Risk Score Calculator ──────────────────────

/**
 * Calculate risk score for a new referral.
 * Auto-flags if score >= 3.
 *
 * Scoring:
 *   +1: Same IP used in another referral
 *   +2: Same IP referred > 3 users total
 *   +1: Same deviceHash in another referral
 *   +1: Multiple referrals from same referrer in 1 hour
 */
export async function calculateRiskScore(
    referrerId: string,
    ip: string | null,
    deviceHash: string | null,
    tx: TxClient
): Promise<{ score: number; flagged: boolean }> {
    let score = 0

    if (ip && ip !== 'unknown') {
        // Same IP used in another referral signup
        const sameIpCount = await tx.referralReward.count({
            where: { signupIp: ip }
        })
        if (sameIpCount > 0) score += 1
        if (sameIpCount > 3) score += 2
    }

    if (deviceHash) {
        const sameDeviceCount = await tx.referralReward.count({
            where: { deviceHash }
        })
        if (sameDeviceCount > 0) score += 1
    }

    // Multiple referrals from same referrer in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentFromReferrer = await tx.referralReward.count({
        where: {
            referrerId,
            createdAt: { gte: oneHourAgo }
        }
    })
    if (recentFromReferrer > 0) score += 1

    return { score, flagged: score >= 3 }
}

// ─── Format Helpers ───────────────────────────────────────────

/** Convert ml to display string: 5000 → "5.0L", 500 → "0.5L" */
export function mlToLitreString(ml: number): string {
    return `${(ml / 1000).toFixed(1)}L`
}
