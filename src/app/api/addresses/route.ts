import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { addressSchema } from '@/lib/validations'
import { successResponse, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const addresses = await prisma.address.findMany({
            where: { userId: user.id },
            orderBy: { isDefault: 'desc' }
        })

        return successResponse(addresses)
    } catch (error) {
        console.error('Address GET error:', error)
        return errorResponse('Failed to fetch addresses', 500)
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const body = await request.json()
        const parsed = addressSchema.safeParse(body)
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message)

        const data = parsed.data

        // P1: Max 10 addresses per user
        const count = await prisma.address.count({ where: { userId: user.id } })
        if (count >= 10) {
            return errorResponse('Maximum 10 addresses allowed. Please delete an existing address first.', 400)
        }

        // Check if PIN is serviceable
        const serviceArea = await prisma.serviceableArea.findFirst({
            where: { pincode: data.pincode, isActive: true }
        })
        if (!serviceArea) {
            return errorResponse('This PIN code is not in our delivery area. We currently serve only Mumbai.', 400)
        }

        // Auto-set default if this is the user's first address
        const isFirstAddress = count === 0

        // If setting as default (or first address), unset others atomically
        if (data.isDefault || isFirstAddress) {
            await prisma.address.updateMany({
                where: { userId: user.id },
                data: { isDefault: false }
            })
        }

        const address = await prisma.address.create({
            data: {
                userId: user.id,
                label: data.label,
                fullName: data.fullName,
                phone: data.phone,
                line1: data.line1,
                line2: data.line2 || '',
                pincode: data.pincode,
                isDefault: data.isDefault || isFirstAddress,
            }
        })

        return successResponse(address, 201)
    } catch (error) {
        console.error('Address POST error:', error)
        return errorResponse('Failed to create address', 500)
    }
}

// P1: Update address
export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const body = await request.json()
        const { addressId, ...updateData } = body

        if (!addressId) return errorResponse('Address ID is required', 400)

        // Verify ownership
        const address = await prisma.address.findFirst({
            where: { id: addressId, userId: user.id }
        })
        if (!address) return errorResponse('Address not found', 404)

        // Validate update data
        const allowedFields = ['label', 'fullName', 'phone', 'line1', 'line2', 'pincode', 'isDefault']
        const filteredData: Record<string, unknown> = {}
        for (const key of allowedFields) {
            if (updateData[key] !== undefined) filteredData[key] = updateData[key]
        }

        // Check PIN serviceability if pincode is changing
        if (filteredData.pincode && filteredData.pincode !== address.pincode) {
            const serviceArea = await prisma.serviceableArea.findFirst({
                where: { pincode: filteredData.pincode as string, isActive: true }
            })
            if (!serviceArea) {
                return errorResponse('This PIN code is not in our delivery area', 400)
            }
        }

        // Handle default flag
        if (filteredData.isDefault === true) {
            await prisma.address.updateMany({
                where: { userId: user.id },
                data: { isDefault: false }
            })
        }

        const updated = await prisma.address.update({
            where: { id: addressId },
            data: filteredData,
        })

        return successResponse(updated)
    } catch (error) {
        console.error('Address PATCH error:', error)
        return errorResponse('Failed to update address', 500)
    }
}

// P1: Delete address
export async function DELETE(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const { searchParams } = new URL(request.url)
        const addressId = searchParams.get('id')
        if (!addressId) return errorResponse('Address ID is required', 400)

        // Verify ownership
        const address = await prisma.address.findFirst({
            where: { id: addressId, userId: user.id }
        })
        if (!address) return errorResponse('Address not found', 404)

        // Check if linked to active subscriptions — return structured error
        const activeSubscriptions = await prisma.subscription.findMany({
            where: { addressId, status: { in: ['ACTIVE', 'PAUSED'] } },
            select: { id: true, status: true, variant: { select: { name: true } } }
        })
        if (activeSubscriptions.length > 0) {
            return successResponse({
                code: 'ADDRESS_IN_USE',
                message: 'This address is linked to active subscriptions. Cancel or update the subscription first.',
                subscriptions: activeSubscriptions.map(s => ({
                    id: s.id,
                    status: s.status,
                    variantName: s.variant?.name || 'Subscription',
                })),
            }, 409)
        }

        const wasDefault = address.isDefault

        await prisma.address.delete({ where: { id: addressId } })

        // Auto-promote: if we deleted the default address, promote the next one
        if (wasDefault) {
            const nextAddress = await prisma.address.findFirst({
                where: { userId: user.id },
                orderBy: { createdAt: 'asc' },
            })
            if (nextAddress) {
                await prisma.address.update({
                    where: { id: nextAddress.id },
                    data: { isDefault: true },
                })
            }
        }

        return successResponse({ message: 'Address deleted successfully' })
    } catch (error) {
        console.error('Address DELETE error:', error)
        return errorResponse('Failed to delete address', 500)
    }
}
