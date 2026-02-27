import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { generateOrderNumber } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { checkAndGrantReferralReward } from '@/lib/referral'

// ═══════════════════════════════════════════════════════════════
// Subscription Cron Processor
// ═══════════════════════════════════════════════════════════════
//
// WHAT THIS DOES:
// Runs nightly (e.g. 1:00 AM IST via Vercel Cron or external).
// Finds all SubscriptionSchedule entries for TOMORROW with
// status = SCHEDULED, and for each:
//   1. Verifies subscription is ACTIVE
//   2. Verifies wallet balance is sufficient
//   3. Creates an Order + OrderItem
//   4. Debits wallet atomically
//   5. Creates DeliverySchedule
//   6. Marks schedule as PROCESSED
//
// IDEMPOTENCY:
// - Each schedule has @@unique([subscriptionId, date])
// - We only process entries with status = SCHEDULED
// - Once set to PROCESSED/FAILED, they won't be picked up again
// - Safe to run multiple times (retries, manual triggers)
//
// FAILURE HANDLING:
// - Each schedule is processed independently (one failure
//   doesn't block others)
// - Failed entries get status = FAILED with reason stored
// - Returns summary of processed/failed counts
//
// SECURITY:
// Protected by CRON_SECRET header. Only the scheduler knows it.
// ═══════════════════════════════════════════════════════════════

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    // ─── Auth: Verify cron secret ───
    const authHeader = request.headers.get('authorization')
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
        logger.security.error('Unauthorized cron call')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ─── Calculate tomorrow's date range (IST) ───
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)

    logger.cron.info(`Processing schedules for ${tomorrow.toISOString().split('T')[0]}`)

    let processed = 0
    let failed = 0
    let skipped = 0
    let totalFetched = 0
    const errors: { scheduleId: string; reason: string }[] = []

    const BATCH_SIZE = 100
    const PARALLEL_CHUNK = 20

    // ─── BATCHED CURSOR LOOP: Never hold more than 100 rows in memory ───
    let cursor: string | undefined = undefined

    while (true) {
        // Build query explicitly to avoid TS circular inference from spread
        const findArgs: Parameters<typeof prisma.subscriptionSchedule.findMany>[0] = {
            where: {
                date: { gte: tomorrow, lt: dayAfter },
                status: 'SCHEDULED',
            },
            include: {
                subscription: {
                    include: {
                        variant: { include: { product: true } },
                        address: true,
                        user: true,
                    }
                }
            },
            take: BATCH_SIZE,
            orderBy: { id: 'asc' as const },
        }
        if (cursor) {
            findArgs.skip = 1
            findArgs.cursor = { id: cursor }
        }

        const schedules = await prisma.subscriptionSchedule.findMany(findArgs)

        if (schedules.length === 0) break
        totalFetched += schedules.length
        cursor = schedules[schedules.length - 1].id

        // ─── PARALLEL CHUNKS: Process 20 at a time ───
        for (let i = 0; i < schedules.length; i += PARALLEL_CHUNK) {
            const chunk = schedules.slice(i, i + PARALLEL_CHUNK)
            const results = await Promise.allSettled(
                chunk.map(schedule => processOneSchedule(schedule as unknown as CronScheduleInput))
            )

            for (const result of results) {
                if (result.status === 'fulfilled') {
                    const r = result.value
                    if (r.outcome === 'processed') processed++
                    else if (r.outcome === 'skipped') skipped++
                    else if (r.outcome === 'failed') {
                        failed++
                        errors.push({ scheduleId: r.scheduleId, reason: r.reason || 'Unknown' })
                    }
                } else {
                    failed++
                }
            }
        }
    }

    const duration = Date.now() - startTime

    // ─── Audit summary ───
    await prisma.auditLog.create({
        data: {
            action: 'CRON_RUN_COMPLETE',
            entity: 'System',
            details: `Cron: ${processed} processed, ${failed} failed, ${skipped} skipped out of ${totalFetched}. Duration: ${duration}ms`,
        }
    })

    logger.cron.info(`[CRON] Complete: ${processed}/${totalFetched} processed, ${failed} failed, ${skipped} skipped [${duration}ms]`)

    return NextResponse.json({
        status: 'complete',
        date: tomorrow.toISOString().split('T')[0],
        total: totalFetched,
        processed,
        failed,
        skipped,
        errors: errors.length > 0 ? errors.slice(0, 50) : undefined,
        durationMs: duration,
    })
}

// ═══════════════════════════════════════════════════════════════
// Process a single schedule entry (extracted for parallel use)
// ═══════════════════════════════════════════════════════════════
type ScheduleResult = { scheduleId: string; outcome: 'processed' | 'skipped' | 'failed'; reason?: string }

interface CronScheduleInput {
    id: string
    date: Date
    quantity: number
    subscription: {
        id: string
        status: string
        user: { id: string; email: string }
        variant: { id: string; name: string; price: number; product: { name: string } }
        address: { id: string }
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processOneSchedule(schedule: CronScheduleInput): Promise<ScheduleResult> {
    const sub = schedule.subscription
    const user = sub.user
    const variant = sub.variant
    const address = sub.address

    try {
        // ─── CLAIM: Optimistic Lock (prevents double billing) ───
        const claimed = await prisma.subscriptionSchedule.updateMany({
            where: { id: schedule.id, status: 'SCHEDULED' },
            data: { status: 'PROCESSING' }
        })
        if (claimed.count === 0) {
            return { scheduleId: schedule.id, outcome: 'skipped', reason: 'Already claimed' }
        }

        // ─── Guard: Subscription no longer active? ───
        if (sub.status !== 'ACTIVE') {
            await prisma.subscriptionSchedule.update({
                where: { id: schedule.id },
                data: { status: 'SKIPPED' }
            })
            return { scheduleId: schedule.id, outcome: 'skipped', reason: `Subscription ${sub.status}` }
        }

        const dailyCost = variant.price * schedule.quantity
        const deliveryFee = 0
        const total = dailyCost + deliveryFee

        // ─── Atomic: Check balance + Create order + Debit wallet ───
        await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({ where: { userId: user.id } })
            if (!wallet || wallet.balance < total) {
                throw new Error(`INSUFFICIENT_BALANCE:₹${wallet?.balance || 0} < ₹${total}`)
            }

            const orderNumber = generateOrderNumber()
            const order = await tx.order.create({
                data: {
                    userId: user.id,
                    addressId: address.id,
                    orderNumber,
                    status: 'CONFIRMED',
                    type: 'SUBSCRIPTION',
                    subtotal: dailyCost,
                    discount: 0,
                    deliveryFee,
                    tax: 0,
                    total,
                    paymentMethod: 'WALLET',
                    paymentStatus: 'PAID',
                    deliveryDate: schedule.date,
                    deliverySlot: 'morning-early',
                    notes: `Auto-generated from subscription ${sub.id}`,
                }
            })

            await tx.orderItem.create({
                data: {
                    orderId: order.id,
                    variantId: variant.id,
                    quantity: schedule.quantity,
                    price: variant.price,
                    total: dailyCost,
                }
            })

            await tx.deliverySchedule.create({
                data: {
                    orderId: order.id,
                    scheduledDate: schedule.date,
                    scheduledSlot: 'Early Morning (5-7 AM)',
                    status: 'PENDING',
                }
            })

            await tx.wallet.update({
                where: { userId: user.id },
                data: { balance: { decrement: total } }
            })

            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'DEBIT',
                    amount: total,
                    description: `Subscription delivery: ${variant.product.name} - ${variant.name} ×${schedule.quantity}`,
                    reference: `sub_${sub.id}_${schedule.date.toISOString().split('T')[0]}`,
                }
            })

            await tx.subscriptionSchedule.update({
                where: { id: schedule.id },
                data: { status: 'PROCESSED' }
            })

            // ─── Referral: Check and grant reward inside this Tx ───
            await checkAndGrantReferralReward(user.id, tx)

            const nextSchedule = await tx.subscriptionSchedule.findFirst({
                where: {
                    subscriptionId: sub.id,
                    status: 'SCHEDULED',
                    date: { gt: schedule.date },
                },
                orderBy: { date: 'asc' }
            })

            if (nextSchedule) {
                await tx.subscription.update({
                    where: { id: sub.id },
                    data: { nextDelivery: nextSchedule.date }
                })
            }

            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'CRON_ORDER_CREATED',
                    entity: 'Order',
                    entityId: order.id,
                    details: `Cron: ${variant.name} ×${schedule.quantity} = ₹${total}. Order: ${orderNumber}`,
                }
            })

            logger.cron.info(`Order created`, { orderNumber, userId: user.email, total })
        })

        return { scheduleId: schedule.id, outcome: 'processed' }

    } catch (err) {
        const reason = err instanceof Error ? err.message : 'Unknown error'

        try {
            await prisma.subscriptionSchedule.update({
                where: { id: schedule.id },
                data: { status: 'FAILED' }
            })

            if (reason.startsWith('INSUFFICIENT_BALANCE')) {
                await prisma.subscription.update({
                    where: { id: sub.id },
                    data: { status: 'PAUSED', pausedAt: new Date() }
                })
                await prisma.auditLog.create({
                    data: {
                        userId: user.id,
                        action: 'SUBSCRIPTION_AUTO_PAUSED',
                        entity: 'Subscription',
                        entityId: sub.id,
                        details: `Auto-paused: ${reason}`,
                    }
                })
                logger.cron.warn(`Subscription auto-paused`, { subscriptionId: sub.id, reason })
            }
        } catch {
            // Can't update schedule status — move on
        }

        logger.cron.error(`Failed schedule`, { scheduleId: schedule.id, reason })
        return { scheduleId: schedule.id, outcome: 'failed', reason }
    }
}
