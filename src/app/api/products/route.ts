import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')

        const where: Record<string, unknown> = { isActive: true }
        if (category) where.category = category

        const products = await prisma.product.findMany({
            where,
            include: {
                variants: {
                    where: { isActive: true },
                    orderBy: { price: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return successResponse(products)
    } catch (error) {
        console.error('Products error:', error)
        return errorResponse('Failed to fetch products', 500)
    }
}
