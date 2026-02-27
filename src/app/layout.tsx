import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import Script from 'next/script'
import WhatsAppFab from '@/components/support/WhatsAppFab'

export const metadata: Metadata = {
  title: 'Milk Ali — Premium Desi Cow Milk | Mumbai',
  description: 'Farm-fresh desi cow milk delivered daily to your doorstep in Mumbai. Pure, unprocessed A2 milk from village farms. Subscribe today.',
  keywords: 'milk delivery mumbai, desi cow milk, A2 milk, milk subscription, farm fresh milk, organic milk mumbai',
  openGraph: {
    title: 'Milk Ali — Premium Desi Cow Milk',
    description: 'Farm-fresh desi cow milk delivered daily in Mumbai',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Milk Ali',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
