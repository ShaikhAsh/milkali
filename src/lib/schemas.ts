// ═══════════════════════════════════════════
// Milkali — Structured Data / JSON-LD Schemas
// ═══════════════════════════════════════════

const SITE_URL = 'https://www.milkali.in'
const LOGO_URL = `${SITE_URL}/images/logo.svg`
const PHONE = '+917710048128'
const EMAIL = 'care@milkali.in'

// ─── Organization ───
export const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Milkali',
    legalName: 'Dairy Delight Milk and Milk Pvt Ltd',
    url: SITE_URL,
    logo: LOGO_URL,
    sameAs: [
        'https://instagram.com/milkali.in',
        'https://twitter.com/milkali',
        'https://facebook.com/milkali',
    ],
    contactPoint: {
        '@type': 'ContactPoint',
        telephone: PHONE,
        email: EMAIL,
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
    },
}

// ─── LocalBusiness (Local SEO) ───
export const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: 'Milkali — Premium Cow Milk Delivery Mumbai',
    image: LOGO_URL,
    url: SITE_URL,
    telephone: PHONE,
    email: EMAIL,
    priceRange: '₹₹',
    address: {
        '@type': 'PostalAddress',
        streetAddress: 'Mumbai',
        addressLocality: 'Mumbai',
        addressRegion: 'Maharashtra',
        postalCode: '400001',
        addressCountry: 'IN',
    },
    geo: {
        '@type': 'GeoCoordinates',
        latitude: 19.076,
        longitude: 72.8777,
    },
    areaServed: {
        '@type': 'City',
        name: 'Mumbai',
    },
    openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '05:00',
        closes: '20:00',
    },
    description:
        'Milkali delivers pure, lab-tested cow milk to your doorstep in Mumbai every morning. Farm-fresh, zero preservatives, FSSAI certified. Subscribe today.',
}

// ─── Products ───
export const productSchemas = [
    {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Milkali Cow Milk — 500ml',
        description:
            'Pure cow milk from indigenous Indian breeds. Lab-tested, farm-fresh, delivered daily in Mumbai. 500ml sealed pack.',
        image: `${SITE_URL}/images/instagram/img3.jpeg`,
        brand: { '@type': 'Brand', name: 'Milkali' },
        offers: {
            '@type': 'Offer',
            url: `${SITE_URL}/products`,
            priceCurrency: 'INR',
            price: '35',
            priceValidUntil: '2027-12-31',
            availability: 'https://schema.org/InStock',
            seller: { '@type': 'Organization', name: 'Milkali' },
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: '5000',
        },
    },
    {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Milkali Cow Milk — 1 Litre',
        description:
            'Premium cow milk, 1 litre pack. Sourced from village farms, lab-tested daily. Best value for Mumbai families.',
        image: `${SITE_URL}/images/instagram/img1.jpg`,
        brand: { '@type': 'Brand', name: 'Milkali' },
        offers: {
            '@type': 'Offer',
            url: `${SITE_URL}/products`,
            priceCurrency: 'INR',
            price: '65',
            priceValidUntil: '2027-12-31',
            availability: 'https://schema.org/InStock',
            seller: { '@type': 'Organization', name: 'Milkali' },
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: '5000',
        },
    },
]

// ─── FAQ (Subscriptions page) ───
export const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'How does the Milkali milk subscription work?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Choose a plan, add your Mumbai address, recharge your wallet, and we deliver fresh cow milk to your doorstep every morning by 7 AM. Your wallet is debited daily.',
            },
        },
        {
            '@type': 'Question',
            name: 'Can I pause or skip milk deliveries?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Absolutely. You can pause, resume, or skip any delivery from your dashboard. Skip requests must be placed before 8 PM the previous day.',
            },
        },
        {
            '@type': 'Question',
            name: 'What if I am not home during delivery?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'We deliver between 5-7 AM and leave the milk at your doorstep in insulated packaging. The milk stays fresh for several hours.',
            },
        },
        {
            '@type': 'Question',
            name: 'How do I pay for my milk subscription?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Through our prepaid wallet system. Load your wallet via UPI, Credit/Debit Card, or Net Banking. Your subscription cost is auto-debited daily.',
            },
        },
        {
            '@type': 'Question',
            name: 'Is there a minimum commitment for Milkali subscription?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'No long-term commitments. You can cancel anytime from your dashboard with zero cancellation fees.',
            },
        },
    ],
}

// ─── WebSite (Sitelinks searchbox) ───
export const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Milkali',
    url: SITE_URL,
    description: 'Premium cow milk delivered fresh daily in Mumbai.',
    publisher: { '@type': 'Organization', name: 'Milkali' },
}
