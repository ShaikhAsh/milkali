import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { faqSchema } from '@/lib/schemas'

export const metadata: Metadata = {
    title: 'Subscription Plans — Milk Delivery Mumbai',
    description:
        'Subscribe to daily cow milk delivery in Mumbai. Flexible plans from ₹35/day. Pause, skip, or cancel anytime. Farm-fresh milk at your doorstep by 7 AM.',
    alternates: { canonical: 'https://www.milkali.in/subscriptions' },
    openGraph: {
        title: 'Milk Subscription Plans — Milkali Mumbai',
        description: 'Daily, alternate day & weekly milk delivery plans. Farm-fresh cow milk from ₹35/day.',
        url: 'https://www.milkali.in/subscriptions',
    },
}

export default function SubscriptionsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd data={faqSchema} />
            {children}
        </>
    )
}
