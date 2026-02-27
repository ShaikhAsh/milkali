import { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { cartItemSchema } from '@/lib/validations'
import { successResponse, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const cart = await prisma.cart.findUnique({
            where: { userId: user.id },
            include: {
                items: {
                    include: {
                        variant: {
                            include: { product: true }
                        }
                    }
                }
            }
        })

        return successResponse(cart)
    } catch (error) {
        console.error('Cart GET error:', error)
        return errorResponse('Failed to fetch cart', 500)
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        const body = await request.json()
        const parsed = cartItemSchema.safeParse(body)
        if (!parsed.success) return errorResponse(parsed.error.issues[0].message)

        const { variantId, quantity } = parsed.data

        // Ensure cart exists
        let cart = await prisma.cart.findUnique({ where: { userId: user.id } })
        if (!cart) {
            cart = await prisma.cart.create({ data: { userId: user.id } })
        }

        // Check if variant exists
        const variant = await prisma.productVariant.findUnique({ where: { id: variantId } })
        if (!variant) return errorResponse('Product variant not found', 404)

        // Atomic upsert — prevents race condition on concurrent add-to-cart
        if (quantity === 0) {
            // Delete if quantity is zero
            await prisma.cartItem.deleteMany({
                where: { cartId: cart.id, variantId }
            })
        } else {
            await prisma.cartItem.upsert({
                where: { cartId_variantId: { cartId: cart.id, variantId } },
                create: { cartId: cart.id, variantId, quantity },
                update: { quantity },
            })
        }

        // Return updated cart
        const updatedCart = await prisma.cart.findUnique({
            where: { userId: user.id },
            include: {
                items: {
                    include: {
                        variant: {
                            include: { product: true }
                        }
                    }
                }
            }
        })

        return successResponse(updatedCart)
    } catch (error) {
        console.error('Cart POST error:', error)
        return errorResponse('Failed to update cart', 500)
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getAuthUser(request)
        if (!user) return errorResponse('Unauthorized', 401)

        await prisma.cart.deleteMany({ where: { userId: user.id } })
        return successResponse({ message: 'Cart cleared' })
    } catch (error) {
        console.error('Cart DELETE error:', error)
        return errorResponse('Failed to clear cart', 500)
    }
}
