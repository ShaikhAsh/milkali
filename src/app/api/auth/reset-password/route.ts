import { NextRequest } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { sendPasswordResetEmail } from '@/lib/email'

// ─── Rate Limiting: 5 requests per IP per 15 minutes ───
const resetIpMap = new Map<string, { count: number; resetAt: number }>()
const RESET_LIMIT = 5
const RESET_WINDOW = 15 * 60 * 1000

function checkResetRateLimit(ip: string): boolean {
    const now = Date.now()
    const entry = resetIpMap.get(ip)
    if (!entry || now > entry.resetAt) {
        resetIpMap.set(ip, { count: 1, resetAt: now + RESET_WINDOW })
        return true
    }
    if (entry.count >= RESET_LIMIT) return false
    entry.count++
    return true
}

// Clean stale entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of resetIpMap) {
        if (now > entry.resetAt) resetIpMap.delete(ip)
    }
}, 5 * 60 * 1000)

// SHA-256 hash for reset tokens (fast, suitable for single-use tokens)
function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action } = body

        // ═══════════════════════════════════════════════════════
        // FORGOT PASSWORD — Request reset email
        // ═══════════════════════════════════════════════════════
        if (action === 'forgot-password') {
            const { email } = body

            if (!email || typeof email !== 'string') {
                return errorResponse('Email is required')
            }

            // Rate limit
            const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                || request.headers.get('x-real-ip')
                || 'unknown'
            if (!checkResetRateLimit(ip)) {
                return errorResponse('Too many requests. Please try again later.', 429)
            }

            // SECURITY: Always return success to prevent account enumeration
            const genericResponse = successResponse({
                message: 'If an account with that email exists, we have sent a password reset link.'
            })

            const user = await prisma.user.findUnique({
                where: { email: email.toLowerCase().trim() }
            })

            if (!user || !user.isActive) {
                return genericResponse
            }

            // Generate cryptographically secure token
            const rawToken = crypto.randomBytes(32).toString('hex')
            const tokenHash = hashToken(rawToken)
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

            // Store ONLY the hash
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordResetTokenHash: tokenHash,
                    passwordResetExpiresAt: expiresAt,
                    passwordResetUsedAt: null, // clear any previous used-at
                }
            })

            // Build reset link with RAW token
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const resetLink = `${appUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`

            // Send email (fire and forget)
            sendPasswordResetEmail({
                email: user.email,
                name: user.name || '',
                resetLink,
            }).catch(err => console.error('Password reset email failed:', err))

            return genericResponse
        }

        // ═══════════════════════════════════════════════════════
        // RESET PASSWORD — Validate token + set new password
        // ═══════════════════════════════════════════════════════
        if (action === 'reset-password') {
            const { token, email, newPassword } = body

            if (!token || !email || !newPassword) {
                return errorResponse('Token, email, and new password are required')
            }

            if (typeof newPassword !== 'string' || newPassword.length < 8) {
                return errorResponse('Password must be at least 8 characters')
            }

            // Rate limit reset attempts too
            const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                || request.headers.get('x-real-ip')
                || 'unknown'
            if (!checkResetRateLimit(ip)) {
                return errorResponse('Too many requests. Please try again later.', 429)
            }

            const user = await prisma.user.findUnique({
                where: { email: email.toLowerCase().trim() }
            })

            if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
                return errorResponse('Invalid or expired reset link. Please request a new one.', 400)
            }

            // Check if token was already used
            if (user.passwordResetUsedAt) {
                return errorResponse('This reset link has already been used. Please request a new one.', 400)
            }

            // Check expiry
            if (new Date() > user.passwordResetExpiresAt) {
                return errorResponse('This reset link has expired. Please request a new one.', 400)
            }

            // Compare token hashes
            const incomingHash = hashToken(token)
            if (incomingHash !== user.passwordResetTokenHash) {
                return errorResponse('Invalid or expired reset link. Please request a new one.', 400)
            }

            // All checks passed — update password atomically
            const newPasswordHash = await hashPassword(newPassword)

            await prisma.$transaction([
                prisma.user.update({
                    where: { id: user.id },
                    data: {
                        passwordHash: newPasswordHash,
                        passwordResetTokenHash: null,
                        passwordResetExpiresAt: null,
                        passwordResetUsedAt: new Date(),
                    }
                })
            ])

            return successResponse({ message: 'Password reset successfully. You can now log in with your new password.' })
        }

        return errorResponse('Invalid action', 400)
    } catch (error) {
        console.error('Password reset error:', error)
        return errorResponse('Internal server error', 500)
    }
}
