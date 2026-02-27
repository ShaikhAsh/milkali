import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { sendWalletRechargeEmail } from '@/lib/email'
import crypto from 'crypto'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const RazorpaySDK = require('razorpay')

function getRazorpayInstance() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return null
    }
    if (process.env.RAZORPAY_KEY_ID === 'rzp_test_demo') {
        return null
    }
    return new RazorpaySDK({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
}

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const wallet = await prisma.wallet.findUnique({
            where: { userId: user.id },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                }
            }
        })

        if (!wallet) {
            const newWallet = await prisma.wallet.create({
                data: { userId: user.id, balance: 0, milkCreditMl: 0 },
                include: { transactions: true }
            })
            return successResponse(newWallet)
        }

        return successResponse(wallet)
    } catch (error) {
        console.error('Wallet GET error:', error)
        return errorResponse('Failed to fetch wallet', 500)
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const body = await request.json()
        const { action } = body

        // Step 1: Create Razorpay order
        if (action === 'create-order' || !action) {
            const { amount } = body
            if (!amount || amount < 100 || amount > 50000) {
                return errorResponse('Amount must be between ₹100 and ₹50,000', 400)
            }

            const razorpay = getRazorpayInstance()

            if (razorpay) {
                // Real Razorpay: create order
                const order = await razorpay.orders.create({
                    amount: Math.round(amount * 100), // paise
                    currency: 'INR',
                    receipt: `wallet_${user.id}_${Date.now()}`,
                    notes: { userId: user.id, type: 'wallet_recharge' },
                })

                // Create PENDING Payment record (webhook can match against this)
                await prisma.payment.create({
                    data: {
                        userId: user.id,
                        method: 'RAZORPAY',
                        status: 'PENDING',
                        amount,
                        razorpayOrderId: order.id,
                    }
                })

                return successResponse({
                    orderId: order.id,
                    amount: amount,
                    keyId: process.env.RAZORPAY_KEY_ID,
                    currency: 'INR',
                    name: 'Milkali',
                    description: `Wallet Recharge - ₹${amount}`,
                })
            } else {
                // ─── PRODUCTION SAFETY: Never credit wallet without payment ───
                // WHY: If Razorpay env vars are missing/malformed, the old code
                // would directly credit the wallet (demo mode). An attacker
                // could exploit this to get unlimited free money.
                //
                // FIX: Hard fail. No Razorpay = no wallet recharge. Period.
                console.error('❌ CRITICAL: Razorpay not configured. Wallet recharge disabled.')
                return errorResponse(
                    'Payment gateway is not configured. Please contact support.',
                    503
                )
            }
        }

        // Step 2: Verify Razorpay payment and credit wallet
        if (action === 'verify-payment') {
            const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = body

            if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
                return errorResponse('Payment verification details required', 400)
            }

            // ─── Idempotency: Already credited by webhook or previous call? ───
            const alreadyCredited = await prisma.walletTransaction.findFirst({
                where: { reference: razorpayPaymentId }
            })
            if (alreadyCredited) {
                const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
                return successResponse({
                    balance: wallet?.balance || 0,
                    message: 'Payment already processed',
                })
            }

            // Verify signature
            const generatedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                .update(`${razorpayOrderId}|${razorpayPaymentId}`)
                .digest('hex')

            if (generatedSignature !== razorpaySignature) {
                console.error('❌ Razorpay signature mismatch')
                return errorResponse('Payment verification failed', 400)
            }

            // Signature valid — credit wallet inside transaction
            const result = await prisma.$transaction(async (tx) => {
                let wallet = await tx.wallet.findUnique({ where: { userId: user.id } })
                if (!wallet) {
                    wallet = await tx.wallet.create({ data: { userId: user.id, balance: 0 } })
                }

                const updatedWallet = await tx.wallet.update({
                    where: { userId: user.id },
                    data: { balance: { increment: amount } }
                })

                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        type: 'CREDIT',
                        amount,
                        description: `Wallet recharge of ₹${amount}`,
                        reference: razorpayPaymentId,
                    }
                })

                // Update Payment record to SUCCESS
                await tx.payment.updateMany({
                    where: { razorpayOrderId },
                    data: {
                        status: 'SUCCESS',
                        razorpayPaymentId,
                        razorpaySignature,
                    }
                })

                await tx.auditLog.create({
                    data: {
                        userId: user.id,
                        action: 'WALLET_RECHARGE',
                        entity: 'Wallet',
                        entityId: wallet.id,
                        details: `Razorpay recharge ₹${amount}. Payment: ${razorpayPaymentId}. New balance: ₹${updatedWallet.balance}`,
                    }
                })

                return updatedWallet
            })

            // Send confirmation email
            if (user.email) {
                await sendWalletRechargeEmail(user.email, {
                    name: user.name || 'Customer',
                    amount,
                    newBalance: result.balance,
                })
            }

            return successResponse({
                balance: result.balance,
                message: `₹${amount} added to wallet successfully`,
            })
        }

        return errorResponse('Invalid action', 400)
    } catch (error) {
        console.error('Wallet POST error:', error)
        return errorResponse('Failed to process wallet request', 500)
    }
}
