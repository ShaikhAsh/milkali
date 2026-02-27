import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import crypto from 'crypto'
import { sendWalletRechargeEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

// ═══════════════════════════════════════════════════════════════
// Razorpay Webhook Handler
// ═══════════════════════════════════════════════════════════════
//
// WHY THIS EXISTS:
// The frontend verify-payment flow works when the user stays on
// the page. But if the user closes the tab, switches apps, or
// has a network blip AFTER paying, the frontend callback never
// fires. Razorpay has the money, but our wallet isn't credited.
//
// This webhook is the SAFETY NET. Razorpay calls this endpoint
// independently, guaranteeing we process every payment.
//
// IDEMPOTENCY LOGIC:
// 1. WebhookEvent.eventId is UNIQUE — duplicate Razorpay retries
//    are caught at DB level (upsert pattern).
// 2. Payment.razorpayPaymentId is UNIQUE — if the frontend
//    already credited via verify-payment, the webhook skips.
// 3. WalletTransaction.reference stores paymentId — used as
//    secondary idempotency check before crediting.
//
// RETRY SAFETY:
// Razorpay retries webhooks up to 24 hours. Because we use
// unique constraints + status checks, retries are safe.
// ═══════════════════════════════════════════════════════════════

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET

// Razorpay sends raw body — we MUST read it as text for HMAC
export async function POST(request: NextRequest) {
    const startTime = Date.now()

    // ─── Step 0: Check webhook secret is configured ───
    if (!WEBHOOK_SECRET) {
        logger.security.error('RAZORPAY_WEBHOOK_SECRET not configured')
        return NextResponse.json(
            { error: 'Webhook not configured' },
            { status: 500 }
        )
    }

    let rawBody: string
    try {
        rawBody = await request.text()
    } catch {
        logger.payment.error('Failed to read request body')
        return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    // ─── Step 1: HMAC Signature Verification (MANDATORY) ───
    const razorpaySignature = request.headers.get('x-razorpay-signature')

    if (!razorpaySignature) {
        logger.security.error('Missing x-razorpay-signature header')
        return NextResponse.json(
            { error: 'Missing signature' },
            { status: 401 }
        )
    }

    const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex')

    if (!crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(razorpaySignature, 'hex')
    )) {
        logger.security.error('Webhook signature verification FAILED — possible tampering')
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
        )
    }

    // ─── Step 2: Parse payload ───
    let payload: Record<string, unknown>
    try {
        payload = JSON.parse(rawBody)
    } catch {
        logger.payment.error('Invalid JSON payload')
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const event = payload.event as string
    const eventId = (payload.account_id as string) + '_' + (payload.event as string) + '_' +
        ((payload.payload as Record<string, Record<string, Record<string, string>>>)?.payment?.entity?.id || Date.now().toString())

    // ─── Step 3: Store raw event for audit (idempotent via eventId) ───
    try {
        const existing = await prisma.webhookEvent.findUnique({
            where: { eventId }
        })

        if (existing && existing.status === 'PROCESSED') {
            logger.payment.info('Event already processed — skipping', { eventId })
            return NextResponse.json({ status: 'already_processed' }, { status: 200 })
        }

        await prisma.webhookEvent.upsert({
            where: { eventId },
            create: {
                eventId,
                eventType: event,
                payload: rawBody,
                status: 'RECEIVED',
            },
            update: {
                status: 'RETRIED',
            }
        })
    } catch (err) {
        logger.payment.error('Failed to log webhook event', { error: String(err) })
        // Continue processing — event logging failure shouldn't block payment
    }

    // ─── Step 4: Handle payment.captured event ───
    if (event === 'payment.captured') {
        try {
            const paymentEntity = (payload.payload as Record<string, Record<string, Record<string, unknown>>>)
                ?.payment?.entity

            if (!paymentEntity) {
                logger.payment.error('Missing payment entity in payload')
                await updateWebhookStatus(eventId, 'FAILED', 'Missing payment entity')
                return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
            }

            const razorpayPaymentId = paymentEntity.id as string
            const razorpayOrderId = paymentEntity.order_id as string
            const amountInPaise = paymentEntity.amount as number
            const amount = amountInPaise / 100 // Convert paise to rupees
            const notes = paymentEntity.notes as Record<string, string> | undefined

            const userId = notes?.userId
            const paymentType = notes?.type

            if (!razorpayPaymentId || !amount || !userId) {
                logger.payment.error('Missing required fields', { razorpayPaymentId, amount, userId })
                await updateWebhookStatus(eventId, 'FAILED', 'Missing required fields')
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
            }

            // ─── Idempotency Check: Already credited? ───
            const existingTxn = await prisma.walletTransaction.findFirst({
                where: { reference: razorpayPaymentId }
            })

            if (existingTxn) {
                logger.payment.info('Payment already credited — idempotent skip', { razorpayPaymentId })
                await updateWebhookStatus(eventId, 'PROCESSED', 'Already credited (idempotent)')
                return NextResponse.json({ status: 'already_credited' }, { status: 200 })
            }

            // ─── Process: Credit wallet inside transaction ───
            if (paymentType === 'wallet_recharge') {
                await prisma.$transaction(async (tx) => {
                    // Ensure wallet exists
                    let wallet = await tx.wallet.findUnique({ where: { userId } })
                    if (!wallet) {
                        wallet = await tx.wallet.create({ data: { userId, balance: 0 } })
                    }

                    // Credit wallet
                    const updatedWallet = await tx.wallet.update({
                        where: { userId },
                        data: { balance: { increment: amount } }
                    })

                    // Record transaction
                    await tx.walletTransaction.create({
                        data: {
                            walletId: wallet.id,
                            type: 'CREDIT',
                            amount,
                            description: `Wallet recharge ₹${amount} (webhook)`,
                            reference: razorpayPaymentId,
                        }
                    })

                    // ─── Payment Record: razorpayOrderId-first lookup ───
                    // WHY: The wallet route creates a PENDING Payment with
                    // razorpayOrderId set but razorpayPaymentId=null.
                    // If we upsert by razorpayPaymentId (which is new/unknown),
                    // Prisma tries INSERT → razorpayOrderId unique constraint
                    // collision → 500 → payment lost forever.
                    //
                    // FIX: Find by razorpayOrderId first. If exists → update.
                    // If not → create fresh.
                    const existingPayment = razorpayOrderId
                        ? await tx.payment.findUnique({ where: { razorpayOrderId } })
                        : null

                    if (existingPayment) {
                        await tx.payment.update({
                            where: { id: existingPayment.id },
                            data: {
                                status: 'SUCCESS',
                                razorpayPaymentId,
                                razorpaySignature: razorpaySignature,
                            },
                        })
                    } else {
                        // Edge case: webhook arrived before frontend created Payment
                        // (or no razorpayOrderId in payload). Create fresh.
                        await tx.payment.upsert({
                            where: { razorpayPaymentId },
                            create: {
                                userId,
                                method: 'RAZORPAY',
                                status: 'SUCCESS',
                                amount,
                                razorpayOrderId,
                                razorpayPaymentId,
                                razorpaySignature: razorpaySignature,
                            },
                            update: {
                                status: 'SUCCESS',
                                razorpayOrderId: razorpayOrderId || undefined,
                            },
                        })
                    }

                    // Audit log
                    await tx.auditLog.create({
                        data: {
                            userId,
                            action: 'WEBHOOK_WALLET_CREDIT',
                            entity: 'Wallet',
                            entityId: wallet.id,
                            details: `Webhook: ₹${amount} credited. Payment: ${razorpayPaymentId}. New balance: ₹${updatedWallet.balance}`,
                        }
                    })

                    logger.payment.info('Wallet credited via webhook', { userId, amount: amount, balance: updatedWallet.balance })
                })

                // Send email (outside transaction — non-critical)
                try {
                    const user = await prisma.user.findUnique({ where: { id: userId } })
                    const wallet = await prisma.wallet.findUnique({ where: { userId } })
                    if (user?.email && wallet) {
                        await sendWalletRechargeEmail(user.email, {
                            name: user.name || 'Customer',
                            amount,
                            newBalance: wallet.balance,
                        })
                    }
                } catch (emailErr) {
                    logger.payment.warn('Email send failed (non-critical)', { error: String(emailErr) })
                }

                await updateWebhookStatus(eventId, 'PROCESSED')

                logger.payment.info('Webhook event processed', { durationMs: Date.now() - startTime })
                return NextResponse.json({ status: 'processed' }, { status: 200 })
            }

            // Unknown payment type — log and acknowledge
            logger.payment.info('Unknown payment type — ignored', { paymentType, razorpayPaymentId })
            await updateWebhookStatus(eventId, 'IGNORED', `Unknown payment type: ${paymentType}`)
            return NextResponse.json({ status: 'ignored' }, { status: 200 })

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error'
            logger.payment.error('Webhook processing failed', { error: errorMsg })
            await updateWebhookStatus(eventId, 'FAILED', errorMsg)

            // Return 500 so Razorpay retries
            return NextResponse.json(
                { error: 'Processing failed' },
                { status: 500 }
            )
        }
    }

    // ─── Other events: acknowledge but don't process ───
    logger.payment.info('Unhandled webhook event received', { event })
    await updateWebhookStatus(eventId, 'IGNORED', `Unhandled event: ${event}`)
    return NextResponse.json({ status: 'ignored' }, { status: 200 })
}

// Helper: Update webhook event status
async function updateWebhookStatus(eventId: string, status: string, error?: string) {
    try {
        await prisma.webhookEvent.update({
            where: { eventId },
            data: {
                status,
                processedAt: status === 'PROCESSED' ? new Date() : undefined,
                error: error || undefined,
            }
        })
    } catch {
        // Silently fail — don't let status update failure break the flow
    }
}
