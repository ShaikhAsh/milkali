'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ═══════════════════════════════════════════════════════════════
// AuthContext — Cookie-Based Authentication State
// ═══════════════════════════════════════════════════════════════
//
// JWT tokens are stored exclusively in HTTP-only cookies.
// This context NEVER touches localStorage or document.cookie.
//
// On mount, it hydrates user state by calling GET /api/user.
// The browser automatically sends the HTTP-only cookie with
// every same-origin fetch, so no manual token management needed.
// ═══════════════════════════════════════════════════════════════

interface User {
    id: string
    email: string
    name: string
    role: string
    isVerified: boolean
}

interface AuthContextType {
    user: User | null
    loading: boolean
    signup: (email: string, password: string, name: string, referralCode?: string) => Promise<{ success: boolean; message: string }>
    login: (email: string, password: string, redirectUrl?: string) => Promise<{ success: boolean; message: string }>
    logout: () => void
    isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    // ─── Hydrate user from cookie on mount ──────────────────
    useEffect(() => {
        fetch('/api/user', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setUser({
                        id: data.data.id,
                        email: data.data.email,
                        name: data.data.name,
                        role: data.data.role,
                        isVerified: data.data.isVerified,
                    })
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    // ─── Silent token refresh every 20 minutes ──────────────
    useEffect(() => {
        if (!user) return

        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ action: 'refresh' }),
                })
                const data = await res.json()
                if (!data.success) {
                    // Refresh token expired → force logout
                    setUser(null)
                    router.push('/auth/login')
                }
            } catch {
                // Network error — retry next interval
            }
        }, 20 * 60 * 1000)

        return () => clearInterval(interval)
    }, [user, router])

    // ─── Signup ─────────────────────────────────────────────
    const signup = useCallback(async (email: string, password: string, name: string, referralCode?: string) => {
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'signup', email, password, name, ...(referralCode ? { referralCode } : {}) }),
            })
            const data = await res.json()
            if (data.success) {
                setUser(data.data.user)
            }
            return { success: data.success, message: data.success ? 'Account created successfully' : data.error }
        } catch {
            return { success: false, message: 'Network error' }
        }
    }, [])

    // ─── Login ──────────────────────────────────────────────
    const login = useCallback(async (email: string, password: string, redirectUrl?: string) => {
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'login', email, password }),
            })
            const data = await res.json()
            if (data.success) {
                setUser(data.data.user)

                // Role-based redirect
                if (data.data.user.role.toUpperCase() === 'ADMIN') {
                    router.push('/admin')
                } else {
                    router.push(redirectUrl || '/dashboard')
                }
            }
            return { success: data.success, message: data.success ? 'Login successful' : data.error }
        } catch {
            return { success: false, message: 'Network error' }
        }
    }, [router])

    // ─── Logout ─────────────────────────────────────────────
    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'logout' }),
            })
        } catch {
            // Best-effort
        }
        setUser(null)
        router.push('/')
    }, [router])

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signup,
            login,
            logout,
            isAdmin: user?.role?.toUpperCase() === 'ADMIN',
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}

// ─── Fetch wrapper (no manual token management needed) ──────
// Browser sends HTTP-only cookie automatically with credentials: 'include'
export function useAuthFetch() {
    return useCallback(async (url: string, options: RequestInit = {}) => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        }
        const res = await fetch(url, { ...options, headers, credentials: 'include' })
        return res.json()
    }, [])
}
