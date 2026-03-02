import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Read Milkali\'s privacy policy — how we collect, use and protect your personal data.',
    alternates: { canonical: 'https://www.milkali.in/privacy' },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
