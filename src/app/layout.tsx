import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import Script from 'next/script'
import WhatsAppFab from '@/components/support/WhatsAppFab'
import JsonLd from '@/components/seo/JsonLd'
import { organizationSchema, localBusinessSchema, websiteSchema } from '@/lib/schemas'

const SITE_URL = 'https://www.milkali.in'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#002E5B',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Milkali — Pure Cow Milk Delivery in Mumbai | Farm Fresh Daily',
    template: '%s | Milkali — Cow Milk Mumbai',
  },
  description:
    'Milkali delivers pure, lab-tested cow milk fresh from village farms to your Mumbai doorstep every morning by 7 AM. Zero preservatives. FSSAI certified. Subscribe from ₹35/day.',
  keywords: [
    'Cow milk Mumbai',
    'Pure Cow milk Mumbai',
    'milk delivery Mumbai',
    'fresh cow milk Mumbai',
    'milk subscription Mumbai',
    'dairy subscription Mumbai',
    'farm fresh milk Mumbai',
    'pure cow milk near me',
    'Cow milk delivery',
    'Milkali',
    'organic milk Mumbai',
    'cow milk online Mumbai',
  ],
  authors: [{ name: 'Milkali', url: SITE_URL }],
  creator: 'Dairy Delight Milk and Milk Pvt Ltd',
  publisher: 'Milkali',
  formatDetection: { telephone: true, email: true },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Milkali',
    title: 'Milkali — Pure Cow Milk Delivered Fresh Daily in Mumbai',
    description:
      'Farm-fresh cow milk from village farms to your Mumbai doorstep every morning. Lab-tested, zero preservatives. Subscribe from ₹35/day.',
    images: [
      {
        url: '/images/instagram/img3.jpeg',
        width: 1200,
        height: 630,
        alt: 'Milkali — Fresh Cow Milk',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Milkali — Pure Cow Milk Delivery Mumbai',
    description:
      'Farm-fresh cow milk delivered to your Mumbai doorstep every morning by 7 AM. Subscribe from ₹35/day.',
    images: ['/images/instagram/img3.jpeg'],
    creator: '@milkali',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  category: 'Food & Beverage',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <JsonLd data={[organizationSchema, localBusinessSchema, websiteSchema]} />
      </head>
      <body>
        <AuthProvider>
          {children}
          <WhatsAppFab />
        </AuthProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
