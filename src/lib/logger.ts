// ═══════════════════════════════════════════════════════════════
// Structured Logger
// ═══════════════════════════════════════════════════════════════
//
// Replaces console.log with structured, categorized logging.
// In production, these can be piped to Vercel Logs, Datadog,
// or any JSON-based log aggregator.
//
// Categories:
//   PAYMENT  — All wallet/Razorpay events
//   CRON     — Subscription processing
//   SECURITY — Auth failures, signature mismatches
//   ORDER    — Order lifecycle events
//   ERROR    — Unhandled exceptions
//   INFO     — General operational events
// ═══════════════════════════════════════════════════════════════

type LogLevel = 'INFO' | 'WARN' | 'ERROR'
type LogCategory = 'PAYMENT' | 'CRON' | 'SECURITY' | 'ORDER' | 'ERROR' | 'INFO' | 'ADMIN' | 'AUTH'

interface LogEntry {
    timestamp: string
    level: LogLevel
    category: LogCategory
    message: string
    data?: Record<string, unknown>
    userId?: string
    requestId?: string
    durationMs?: number
}

function formatLog(entry: LogEntry): string {
    return JSON.stringify(entry)
}

function log(level: LogLevel, category: LogCategory, message: string, data?: Record<string, unknown>) {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        category,
        message,
        ...data && { data },
    }

    const formatted = formatLog(entry)

    switch (level) {
        case 'ERROR':
            console.error(formatted)
            break
        case 'WARN':
            console.warn(formatted)
            break
        default:
            console.log(formatted)
    }
}

export const logger = {
    // ─── Payment events ───
    payment: {
        info: (message: string, data?: Record<string, unknown>) =>
            log('INFO', 'PAYMENT', message, data),
        error: (message: string, data?: Record<string, unknown>) =>
            log('ERROR', 'PAYMENT', message, data),
        warn: (message: string, data?: Record<string, unknown>) =>
            log('WARN', 'PAYMENT', message, data),
    },

    // ─── Cron events ───
    cron: {
        info: (message: string, data?: Record<string, unknown>) =>
            log('INFO', 'CRON', message, data),
        error: (message: string, data?: Record<string, unknown>) =>
            log('ERROR', 'CRON', message, data),
        warn: (message: string, data?: Record<string, unknown>) =>
            log('WARN', 'CRON', message, data),
    },

    // ─── Security events ───
    security: {
        info: (message: string, data?: Record<string, unknown>) =>
            log('INFO', 'SECURITY', message, data),
        error: (message: string, data?: Record<string, unknown>) =>
            log('ERROR', 'SECURITY', message, data),
        warn: (message: string, data?: Record<string, unknown>) =>
            log('WARN', 'SECURITY', message, data),
    },

    // ─── Order events ───
    order: {
        info: (message: string, data?: Record<string, unknown>) =>
            log('INFO', 'ORDER', message, data),
        error: (message: string, data?: Record<string, unknown>) =>
            log('ERROR', 'ORDER', message, data),
    },

    // ─── Auth events ───
    auth: {
        info: (message: string, data?: Record<string, unknown>) =>
            log('INFO', 'AUTH', message, data),
        error: (message: string, data?: Record<string, unknown>) =>
            log('ERROR', 'AUTH', message, data),
        warn: (message: string, data?: Record<string, unknown>) =>
            log('WARN', 'AUTH', message, data),
    },

    // ─── Admin events ───
    admin: {
        info: (message: string, data?: Record<string, unknown>) =>
            log('INFO', 'ADMIN', message, data),
        error: (message: string, data?: Record<string, unknown>) =>
            log('ERROR', 'ADMIN', message, data),
    },

    // ─── General ───
    info: (message: string, data?: Record<string, unknown>) =>
        log('INFO', 'INFO', message, data),
    error: (message: string, data?: Record<string, unknown>) =>
        log('ERROR', 'ERROR', message, data),
    warn: (message: string, data?: Record<string, unknown>) =>
        log('WARN', 'INFO', message, data),
}
