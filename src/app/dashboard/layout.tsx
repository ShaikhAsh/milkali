'use client'
import { useAuth } from '@/context/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading && !user) {
            // Not logged in → replace (not push) to prevent back-button loop
            router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`)
        }
        // DO NOT redirect logged-in users — allow all sub-routes to render
    }, [user, loading, router, pathname])

    // Show loader while auth is loading or user is not yet available
    if (loading || !user) {
        return <div className="loader"><div className="spinner" /></div>
    }

    // Render the child page (dashboard root, referrals, orders, wallet, etc.)
    return <>{children}</>
}
