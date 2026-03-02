/**
 * ═══════════════════════════════════════════════════════════════
 * Environment Variable Validation — Server Startup Guard
 * ═══════════════════════════════════════════════════════════════
 *
 * Validates all critical environment variables at import time.
 * In development: throws immediately to prevent silent failures.
 * In production: logs CRITICAL warnings but continues (crash
 * would prevent the healthcheck endpoint from reporting status).
 *
 * Import this module early (e.g., from auth.ts) so validation
 * runs before any request is processed.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

interface EnvVar {
    name: string
    required: boolean
    minLength?: number
}

const REQUIRED_VARS: EnvVar[] = [
    { name: 'DATABASE_URL', required: true },
    { name: 'JWT_SECRET', required: true, minLength: 32 },
    { name: 'JWT_REFRESH_SECRET', required: true, minLength: 32 },
    { name: 'CRON_SECRET', required: true },
    { name: 'RAZORPAY_KEY_ID', required: true },
    { name: 'RAZORPAY_KEY_SECRET', required: true },
    { name: 'RAZORPAY_WEBHOOK_SECRET', required: true },
    { name: 'NEXT_PUBLIC_APP_URL', required: true },
]

export function validateEnv(): void {
    const missing: string[] = []
    const weak: string[] = []

    for (const v of REQUIRED_VARS) {
        const value = process.env[v.name]
        if (!value) {
            missing.push(v.name)
        } else if (v.minLength && value.length < v.minLength) {
            weak.push(`${v.name} (must be ≥${v.minLength} chars, got ${value.length})`)
        }
    }

    if (missing.length > 0 || weak.length > 0) {
        const message = [
            missing.length > 0 ? `Missing: ${missing.join(', ')}` : '',
            weak.length > 0 ? `Weak: ${weak.join(', ')}` : '',
        ].filter(Boolean).join(' | ')

        if (IS_PRODUCTION) {
            console.error(`🚨 CRITICAL ENV WARNING: ${message}`)
        } else {
            throw new Error(`❌ FATAL: Environment validation failed — ${message}`)
        }
    }
}

// Run validation on import
validateEnv()
