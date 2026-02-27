import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// ═══════════════════════════════════════════════════════════════
// Next.js Middleware — Edge-Runtime Route Protection
// ═══════════════════════════════════════════════════════════════
//
// Reads JWT from HTTP-only cookie `milk-ali-token`.
// Uses `jose` (Edge-compatible) to verify.
// Enforces:
//   /admin/*       → ADMIN role only
//   /dashboard/*   → Any authenticated user
//   /api/cron/*    → CRON_SECRET bearer token only
// ═══════════════════════════════════════════════════════════════

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '')

const ADMIN_ROUTES = ['/admin']
const AUTH_ROUTES = ['/dashboard']
const CRON_ROUTES = ['/api/cron']

interface TokenPayload {
    userId: string
    email: string
    role: string
}

async function verifyJWT(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload as unknown as TokenPayload
    } catch {
        return null
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // ─── Cron routes: verify CRON_SECRET ───
    if (CRON_ROUTES.some(r => pathname.startsWith(r))) {
        const auth = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET
        if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.next()
    }

    // ─── Skip non-protected routes ───
    const isAdminRoute = ADMIN_ROUTES.some(r => pathname.startsWith(r))
    const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))

    if (!isAdminRoute && !isAuthRoute) {
        return NextResponse.next()
    }

    // ─── Extract token from HTTP-only cookie ───
    const token = request.cookies.get('milk-ali-token')?.value

    if (!token) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    const user = await verifyJWT(token)

    if (!user) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // ─── Admin routes: require ADMIN role (case-insensitive) ───
    if (isAdminRoute && user.role.toUpperCase() !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/dashboard/:path*',
        '/api/cron/:path*',
    ],
}
