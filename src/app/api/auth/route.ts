import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import {
    generateToken,
    generateRefreshToken,
    verifyRefreshToken,
    hashPassword,
    comparePassword,
    setAuthCookies,
    clearAuthCookies,
} from '@/lib/auth'
import { signupSchema, loginSchema } from '@/lib/validations'
import { sendWelcomeEmail } from '@/lib/email'

// ═══════════════════════════════════════════════════════════════
// AUTH API — Cookie-Based JWT Authentication
// ═══════════════════════════════════════════════════════════════
//
// Actions: signup, login, refresh, logout
//
// Tokens are NEVER returned in JSON response body.
// They are set exclusively as HTTP-only cookies via setAuthCookies().
// ═══════════════════════════════════════════════════════════════

import { authLimiter } from '@/lib/rateLimit'

// ─── Helpers ────────────────────────────────────────────────
function getClientIp(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown'
}

function jsonError(message: string, status = 400) {
    return NextResponse.json({ success: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action } = body

        // ═══════════════════════════════════════════════════════
        // SIGNUP
        // ═══════════════════════════════════════════════════════
        if (action === 'signup') {
            const parsed = signupSchema.safeParse(body)
            if (!parsed.success) {
                return jsonError(parsed.error.issues[0].message)
            }

            const { email, password, name } = parsed.data

            const clientIp = getClientIp(request)
            const { success: rlOk } = await authLimiter.limit(clientIp)
            if (!rlOk) {
                return jsonError('Too many requests from this IP. Please try again later.', 429)
            }

            const existingUser = await prisma.user.findUnique({ where: { email } })
            if (existingUser) {
                return jsonError('An account with this email already exists. Please log in.', 409)
            }

            // ─── Referral Code Handling ───
            const { referralCode, deviceHash: rawDeviceHash } = body
            let referredById: string | null = null
            const deviceHash = typeof rawDeviceHash === 'string' ? rawDeviceHash.slice(0, 64) : null

            if (referralCode && typeof referralCode === 'string') {
                const { isReferralRateLimited, calculateRiskScore } = await import('@/lib/referral')

                const ipBlocked = await isReferralRateLimited(clientIp, prisma)
                if (!ipBlocked) {
                    const referrer = await prisma.user.findFirst({
                        where: { referralCode: referralCode.toUpperCase().trim(), isActive: true },
                        select: { id: true, email: true, phone: true }
                    })
                    if (referrer) {
                        if (referrer.email.toLowerCase() !== email.toLowerCase()) {
                            const risk = await calculateRiskScore(referrer.id, clientIp, deviceHash, prisma)
                            if (risk.score < 5) {
                                referredById = referrer.id
                            }
                        }
                    }
                }
            }

            const passwordHash = await hashPassword(password)

            const { generateUniqueReferralCode } = await import('@/lib/referral')
            const newReferralCode = await generateUniqueReferralCode(prisma)

            const user = await prisma.user.create({
                data: {
                    email,
                    name,
                    passwordHash,
                    referralCode: newReferralCode,
                    referredById,
                    signupIp: clientIp !== 'unknown' ? clientIp : null,
                    isVerified: true,
                }
            })

            // Create wallet
            await prisma.wallet.create({
                data: { userId: user.id, balance: 0, milkCreditMl: 0 }
            })

            // ReferralReward tracking
            if (referredById) {
                try {
                    const { calculateRiskScore } = await import('@/lib/referral')
                    const risk = await calculateRiskScore(referredById, clientIp, deviceHash, prisma)
                    await prisma.referralReward.create({
                        data: {
                            referrerId: referredById,
                            referredUserId: user.id,
                            signupIp: clientIp !== 'unknown' ? clientIp : null,
                            deviceHash,
                            referralRiskScore: risk.score,
                            flaggedAt: risk.flagged ? new Date() : null,
                        }
                    })
                } catch (err: unknown) {
                    console.error('ReferralReward creation failed:', err)
                }
            }

            sendWelcomeEmail(email, name).catch(() => { })

            // Build JWT payload with UPPERCASE role
            const payload = { userId: user.id, email: user.email, role: user.role.toUpperCase() }
            const token = generateToken(payload, user.tokenVersion)
            const refreshToken = generateRefreshToken(payload, user.tokenVersion)

            // Set cookies — do NOT return tokens in JSON
            const response = NextResponse.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        isVerified: true,
                    }
                }
            })
            return setAuthCookies(response, token, refreshToken)
        }

        // ═══════════════════════════════════════════════════════
        // LOGIN
        // ═══════════════════════════════════════════════════════
        if (action === 'login') {
            const parsed = loginSchema.safeParse(body)
            if (!parsed.success) {
                return jsonError(parsed.error.issues[0].message)
            }

            const { email, password } = parsed.data

            const clientIp = getClientIp(request)
            const { success: rlOk } = await authLimiter.limit(clientIp)
            if (!rlOk) {
                return jsonError('Too many requests from this IP. Please try again later.', 429)
            }

            const user = await prisma.user.findUnique({ where: { email } })
            if (!user) return jsonError('Invalid email or password', 401)

            if (!user.passwordHash) return jsonError('Account has no password set. Please contact support.', 401)
            const isValid = await comparePassword(password, user.passwordHash)
            if (!isValid) return jsonError('Invalid email or password', 401)

            // Build JWT payload with UPPERCASE role
            const payload = { userId: user.id, email: user.email, role: user.role.toUpperCase() }
            const token = generateToken(payload, user.tokenVersion)
            const refreshToken = generateRefreshToken(payload, user.tokenVersion)

            // Set cookies — do NOT return tokens in JSON
            const response = NextResponse.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        isVerified: user.isVerified,
                    }
                }
            })
            return setAuthCookies(response, token, refreshToken)
        }

        // ═══════════════════════════════════════════════════════
        // REFRESH — Rotate tokens silently
        // ═══════════════════════════════════════════════════════
        if (action === 'refresh') {
            // Read refresh token from cookie
            const refreshCookie = request.cookies.get('milk-ali-refresh')?.value
            if (!refreshCookie) return jsonError('Refresh token required', 401)

            const payload = verifyRefreshToken(refreshCookie)
            if (!payload) return jsonError('Invalid refresh token', 401)

            const user = await prisma.user.findUnique({ where: { id: payload.userId } })
            if (!user) return jsonError('User not found', 404)

            // ─── Token Version Check: Reject revoked tokens ───
            const tokenVersion = (payload as unknown as Record<string, unknown>).v as number | undefined
            if (tokenVersion !== undefined && tokenVersion !== user.tokenVersion) {
                return jsonError('Token has been revoked. Please log in again.', 401)
            }

            const newPayload = { userId: user.id, email: user.email, role: user.role.toUpperCase() }
            const newToken = generateToken(newPayload, user.tokenVersion)
            const newRefreshToken = generateRefreshToken(newPayload, user.tokenVersion)

            const response = NextResponse.json({ success: true })
            return setAuthCookies(response, newToken, newRefreshToken)
        }

        // ═══════════════════════════════════════════════════════
        // LOGOUT — Clear cookies server-side
        // ═══════════════════════════════════════════════════════
        if (action === 'logout') {
            const response = NextResponse.json({ success: true })
            return clearAuthCookies(response)
        }

        return jsonError('Invalid action', 400)
    } catch (error) {
        console.error('Auth error:', error)
        return jsonError('Internal server error', 500)
    }
}
