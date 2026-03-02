import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms & Conditions',
    description: 'Read the terms and conditions for using Milkali\'s milk delivery and subscription services in Mumbai.',
    alternates: { canonical: 'https://www.milkali.in/terms' },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
