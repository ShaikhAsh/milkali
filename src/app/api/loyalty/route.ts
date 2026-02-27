import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'

// GET: Fetch loyalty balance + transaction history
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        // B2C users only
        if (user.role.toUpperCase() !== 'B2C') {
            return errorResponse('Loyalty points are only available for B2C customers', 403)
        }

        const account = await prisma.loyaltyAccount.findUnique({
            where: { userId: user.id },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
        })

        if (!account) {
            return successResponse({
                balance: 0,
                totalEarned: 0,
                totalRedeemed: 0,
                totalReversed: 0,
                transactions: [],
            })
        }

        return successResponse({
            balance: account.balance,
            totalEarned: account.totalEarned,
            totalRedeemed: account.totalRedeemed,
            totalReversed: account.totalReversed,
            transactions: account.transactions,
        })
    } catch (error) {
        console.error('Loyalty GET error:', error)
        return errorResponse('Failed to fetch loyalty data', 500)
    }
}

// POST: Redeem points (stub)
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        if (user.role.toUpperCase() !== 'B2C') {
            return errorResponse('Loyalty points are only available for B2C customers', 403)
        }

        const body = await request.json()
        const { action } = body

        if (action === 'redeem') {
            return successResponse({
                message: 'Points redemption is coming soon! Stay tuned.',
                redeemed: false,
            })
        }

        return errorResponse('Invalid action', 400)
    } catch (error) {
        console.error('Loyalty POST error:', error)
        return errorResponse('Failed to process loyalty action', 500)
    }
}
