/**
 * WhatsApp Support Utility
 * Level-1 integration: wa.me links with prefilled contextual messages.
 * No bots, no external SaaS, no API keys.
 */

const SUPPORT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919372236321'

/**
 * Build a WhatsApp deep link with a prefilled message.
 * Mobile → opens WhatsApp app. Desktop → opens web.whatsapp.com.
 */
export function buildWhatsAppUrl(message: string): string {
    return `https://wa.me/${SUPPORT_NUMBER}?text=${encodeURIComponent(message.trim())}`
}

/**
 * Open WhatsApp in a new tab (safe for SSR — no-ops server-side).
 */
export function openWhatsApp(message: string): void {
    if (typeof window === 'undefined') return
    window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer')
}

// ─── Prefilled message builders ───

export function genericSupportMessage(): string {
    return `Hi Milkali Support,\n\nI need help.\n\nPlease assist me.`
}

export function userSupportMessage(userId: string, email: string): string {
    return `Hi Milkali Support,\n\nUser ID: ${userId}\nEmail: ${email}\n\nI need help with my account.`
}

export function orderSupportMessage(
    orderId: string,
    orderNumber: string,
    items: string,
    deliveryDate: string | null,
    userId: string
): string {
    return `Hi Milkali Support,\n\nI need help with my order.\n\nOrder: ${orderNumber}\nOrder ID: ${orderId}\nItems: ${items}\n${deliveryDate ? `Delivery: ${deliveryDate}\n` : ''}User ID: ${userId}\n\nPlease assist.`
}

export function subscriptionSupportMessage(
    subId: string,
    variantName: string,
    frequency: string,
    nextDelivery: string | null,
    userId: string
): string {
    return `Hi Milkali Support,\n\nI need help with my subscription.\n\nSubscription ID: ${subId}\nProduct: ${variantName}\nFrequency: ${frequency}\n${nextDelivery ? `Next Delivery: ${nextDelivery}\n` : ''}User ID: ${userId}\n\nPlease assist.`
}

export function addressSupportMessage(
    addressId: string,
    reason: string,
    userId: string
): string {
    return `Hi Milkali Support,\n\nI'm having trouble with an address.\n\nAddress ID: ${addressId}\nIssue: ${reason}\nUser ID: ${userId}\n\nPlease help me resolve this.`
}
