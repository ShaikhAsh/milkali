import { z } from 'zod'

export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name is required'),
})

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

export const addressSchema = z.object({
    label: z.string().min(1).max(50).default('Home'),
    fullName: z.string().min(2, 'Name is required'),
    phone: z.string().min(10, 'Valid phone number required'),
    line1: z.string().min(5, 'Address line 1 is required'),
    line2: z.string().optional(),
    pincode: z.string().length(6, 'PIN code must be 6 digits'),
    isDefault: z.boolean().optional(),
})

export const cartItemSchema = z.object({
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(100),
})

export const createOrderSchema = z.object({
    addressId: z.string().uuid(),
    paymentMethod: z.enum(['WALLET', 'RAZORPAY', 'COD']),
    deliveryDate: z.string().optional(),
    deliverySlot: z.string().optional(),
    couponCode: z.string().optional(),
    notes: z.string().optional(),
})

export const subscriptionSchema = z.object({
    variantId: z.string().uuid(),
    addressId: z.string().uuid(),
    frequency: z.enum(['DAILY', 'ALTERNATE', 'WEEKLY', 'CUSTOM']),
    quantity: z.number().int().min(1).max(50),
    startDate: z.string(),
    isCustom: z.boolean().optional(),
    deliveryDays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).optional(),
})

export const walletRechargeSchema = z.object({
    amount: z.number().min(100, 'Minimum recharge amount is ₹100').max(50000),
})

export const b2bInquirySchema = z.object({
    businessName: z.string().min(2, 'Business name is required'),
    contactPerson: z.string().min(2, 'Contact person name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number required'),
    businessType: z.string().optional(),
    expectedDailyQty: z.string().optional(),
    message: z.string().optional(),
})

export const contactSchema = z.object({
    name: z.string().min(2, 'Name is required').max(100, 'Name is too long'),
    email: z.string().email('Valid email is required').max(255),
    phone: z.string().max(20).optional(),
    type: z.enum(['GENERAL', 'B2B', 'CALLBACK', 'COMPLAINT']).default('GENERAL'),
    subject: z.string().max(200).optional(),
    message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
})

export const couponSchema = z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    description: z.string().optional(),
    type: z.enum(['PERCENTAGE', 'FLAT']),
    value: z.number().min(1),
    minOrder: z.number().min(0).default(0),
    maxDiscount: z.number().optional(),
    usageLimit: z.number().optional(),
    validFrom: z.string(),
    validUntil: z.string(),
})

export const serviceAreaSchema = z.object({
    pincode: z.string().length(6),
    area: z.string().min(2),
    isActive: z.boolean().default(true),
})
