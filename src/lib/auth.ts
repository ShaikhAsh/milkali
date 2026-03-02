import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import prisma from './db'
import './validateEnv'

// ═══════════════════════════════════════════════════════════════
// AUTH MODULE — Enterprise-Grade Cookie-Based JWT Authentication
// ═══════════════════════════════════════════════════════════════
//
// Single source of truth for:
//  • Token generation & verification (jsonwebtoken — Node runtime)
//  • Password hashing (bcrypt)
//  • HTTP-only cookie management
//  • User extraction from request
//  • Role enforcement
//
// Middleware uses `jose` (Edge runtime) separately but reads the
// same `milk-ali-token` cookie with the same JWT_SECRET.
// ═══════════════════════════════════════════════════════════════

const JWT_SECRET = process.env.JWT_SECRET
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error('❌ FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in .env')
}

// ─── Cookie Configuration ───────────────────────────────────
const AUTH_COOKIE = 'milk-ali-token'
const REFRESH_COOKIE = 'milk-ali-refresh'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? ('strict' as const) : ('lax' as const),
    path: '/',
}

// ─── JWT Payload ────────────────────────────────────────────
export interface JWTPayload {
    userId: string
    email: string
    role: string
}

// ─── Token Generation ───────────────────────────────────────
export function generateToken(payload: JWTPayload, tokenVersion: number): string {
    return jwt.sign({ ...payload, v: tokenVersion }, JWT_SECRET!, { expiresIn: 86400 }) // 24h
}

export function generateRefreshToken(payload: JWTPayload, tokenVersion: number): string {
    return jwt.sign({ ...payload, v: tokenVersion }, JWT_REFRESH_SECRET!, { expiresIn: 604800 }) // 7d
}

// ─── Token Verification ─────────────────────────────────────
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET!) as JWTPayload
    } catch {
        return null
    }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET!) as JWTPayload
    } catch {
        return null
    }
}

// ─── Password Hashing ───────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

// ─── Cookie Management ──────────────────────────────────────
// Sets both auth + refresh token cookies on a NextResponse
export function setAuthCookies(
    response: NextResponse,
    token: string,
    refreshToken: string,
): NextResponse {
    response.cookies.set(AUTH_COOKIE, token, {
        ...COOKIE_OPTIONS,
        maxAge: 86400, // 24h
    })
    response.cookies.set(REFRESH_COOKIE, refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 604800, // 7d
    })
    return response
}

// Clears auth cookies (logout)
export function clearAuthCookies(response: NextResponse): NextResponse {
    response.cookies.set(AUTH_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 })
    response.cookies.set(REFRESH_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 })
    return response
}

// ─── User Extraction from Request ───────────────────────────
// Reads JWT from HTTP-only cookie (primary) or Authorization
// header (fallback for external API clients).
export async function getAuthUser(request: NextRequest) {
    // Primary: HTTP-only cookie
    let token = request.cookies.get(AUTH_COOKIE)?.value

    // Fallback: Authorization header (for external/programmatic access)
    if (!token) {
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1]
        }
    }

    if (!token) return null

    const payload = verifyToken(token)
    if (!payload) return null

    // Minimal select — no wallet/b2bProfile unless caller needs them
    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            isVerified: true,
            tokenVersion: true,
            referralCode: true,
            createdAt: true,
        },
    })

    if (!user) return null

    // Reject banned / deactivated users
    if (!user.isActive) return null

    // Token version check: reject revoked sessions
    const tokenVersion = (payload as unknown as Record<string, unknown>).v as number | undefined
    if (tokenVersion !== undefined && tokenVersion !== user.tokenVersion) return null

    return user
}

// ─── Role Enforcement ───────────────────────────────────────
// Case-insensitive comparison to prevent admin/ADMIN mismatches
export function requireRole(userRole: string, allowedRoles: string[]): boolean {
    const normalized = userRole.toUpperCase()
    return allowedRoles.some(r => r.toUpperCase() === normalized)
}
