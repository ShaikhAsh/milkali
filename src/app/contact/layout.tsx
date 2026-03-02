import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Contact Us — Milkali Support',
    description:
        'Get in touch with Milkali — Mumbai\'s trusted cow milk delivery service. Call, WhatsApp or email us. Support hours: Mon-Sat, 8 AM — 8 PM.',
    alternates: { canonical: 'https://www.milkali.in/contact' },
    openGraph: {
        title: 'Contact Milkali — Customer Support',
        description: 'Reach out to Milkali for queries, delivery issues, or business inquiries. Available Mon-Sat, 8 AM — 8 PM.',
        url: 'https://www.milkali.in/contact',
    },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
