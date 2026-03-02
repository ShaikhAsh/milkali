import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Blog — Milk, Health & Dairy Tips',
    description:
        'Read the Milkali blog for tips on cow milk benefits, dairy nutrition, healthy recipes, and Mumbai milk delivery insights.',
    alternates: { canonical: 'https://www.milkali.in/blog' },
    openGraph: {
        title: 'Milkali Blog — Milk & Health Insights',
        description: 'Tips on cow milk, dairy nutrition, recipes, and milk delivery in Mumbai.',
        url: 'https://www.milkali.in/blog',
    },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
