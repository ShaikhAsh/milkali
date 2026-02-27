import { NextResponse } from 'next/server'
import crypto from 'crypto'

export function successResponse(data: unknown, status = 200) {
    return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status = 400) {
    return NextResponse.json({ success: false, error: message }, { status })
}

// SECURITY: Crypto-safe unique order number
export function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = crypto.randomBytes(3).toString('hex').toUpperCase()
    return `MA-${timestamp}-${random}`
}

export function generateReferralCode(name: string): string {
    const prefix = (name || 'MILK').substring(0, 4).toUpperCase()
    const random = crypto.randomBytes(3).toString('hex').toUpperCase()
    return `${prefix}${random}`
}

// Mumbai PIN codes validation
const MUMBAI_PIN_RANGES = [
    [400001, 400107],
    [401101, 401210],
]

export function isMumbaiPincode(pincode: string): boolean {
    const pin = parseInt(pincode)
    return MUMBAI_PIN_RANGES.some(([min, max]) => pin >= min && pin <= max)
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount)
}

export function getDeliverySlots(): { id: string; label: string; time: string }[] {
    return [
        { id: 'morning-early', label: 'Early Morning', time: '5:00 AM - 7:00 AM' },
        { id: 'morning', label: 'Morning', time: '7:00 AM - 9:00 AM' },
        { id: 'morning-late', label: 'Late Morning', time: '9:00 AM - 11:00 AM' },
    ]
}
