import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Refund Policy',
    description: 'Read Milkali\'s refund and cancellation policy for milk subscriptions and wallet recharges.',
    alternates: { canonical: 'https://www.milkali.in/refund' },
}

export default function RefundLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
