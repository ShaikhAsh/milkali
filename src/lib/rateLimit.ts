import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Auth: 10 requests per 10 seconds per IP (login/signup/refresh)
export const authLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    prefix: 'rl:auth',
})

// Wallet: 20 requests per minute per user
export const walletLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '60 s'),
    prefix: 'rl:wallet',
})

// Orders: 10 creates per minute per user
export const orderLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    prefix: 'rl:orders',
})

// Contact: 5 submissions per hour per IP
export const contactLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '3600 s'),
    prefix: 'rl:contact',
})

// Password Reset: 5 requests per 15 minutes per IP
export const resetPasswordLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '900 s'),
    prefix: 'rl:reset',
})
