import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Our Story — About Milkali',
    description:
        'Learn about Milkali — Mumbai\'s trusted Cow milk brand. From village farms to your doorstep, our mission is pure, fresh, lab-tested milk delivered daily.',
    alternates: { canonical: 'https://www.milkali.in/about' },
    openGraph: {
        title: 'About Milkali — Our Story',
        description: 'From village farms to Mumbai doorsteps — the Milkali journey of delivering pure Cow milk daily.',
        url: 'https://www.milkali.in/about',
    },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
