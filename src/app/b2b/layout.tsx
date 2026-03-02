import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Business Partnership — Bulk Milk Supply Mumbai',
    description:
        'Partner with Milkali for bulk cow milk supply in Mumbai. Competitive pricing, reliable daily delivery, dedicated account manager for hotels, cafes & restaurants.',
    alternates: { canonical: 'https://www.milkali.in/b2b' },
    openGraph: {
        title: 'B2B Milk Supply — Milkali Mumbai',
        description: 'Premium bulk cow milk supply for hotels, cafes, restaurants, and retailers in Mumbai.',
        url: 'https://www.milkali.in/b2b',
    },
}

export default function B2BLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
