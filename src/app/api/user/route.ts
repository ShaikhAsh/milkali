import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { z } from 'zod'

// P1: Input validation for profile updates
const updateUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    phone: z.string().regex(/^\d{10}$/, 'Phone must be a valid 10-digit number').optional(),
})

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        return successResponse({
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
        })
    } catch (error) {
        console.error('User GET error:', error)
        return errorResponse('Failed to fetch user', 500)
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const body = await request.json()
        const parsed = updateUserSchema.safeParse(body)
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message)

        const { name, phone } = parsed.data

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
            }
        })

        return successResponse({
            id: updated.id,
            email: updated.email,
            name: updated.name,
            phone: updated.phone,
            role: updated.role,
        })
    } catch (error) {
        console.error('User PATCH error:', error)
        return errorResponse('Failed to update user', 500)
    }
}
