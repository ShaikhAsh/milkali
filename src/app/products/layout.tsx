import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import { productSchemas } from '@/lib/schemas'

export const metadata: Metadata = {
    title: 'Products — Premium Cow Milk',
    description:
        'Shop Milkali\'s premium cow milk in 500ml and 1 Litre packs. Lab-tested, farm-fresh, delivered daily in Mumbai. Starting at ₹35.',
    alternates: { canonical: 'https://www.milkali.in/products' },
    openGraph: {
        title: 'Milkali Products — Premium Cow Milk',
        description: 'Pure cow milk in 500ml and 1L packs. Lab-tested, farm-fresh, delivered daily in Mumbai.',
        url: 'https://www.milkali.in/products',
    },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <JsonLd data={productSchemas} />
            {children}
        </>
    )
}
