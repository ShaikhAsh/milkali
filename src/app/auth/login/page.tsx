'use client'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'

function LoginForm() {
    const { user, login } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const redirectUrl = searchParams.get('redirect') || '/dashboard'

    useEffect(() => {
        if (user) router.push(redirectUrl)
    }, [user, router, redirectUrl])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        const res = await login(email, password, redirectUrl)
        if (!res.success) setError(res.message || 'Invalid email or password')
        setLoading(false)
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <Link href="/" style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
                    <img src="/images/logo.svg" alt="Milkali" style={{ height: '52px' }} />
                </Link>

                <h2>Welcome Back</h2>
                <p className="auth-subtitle">Enter your credentials to sign in</p>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            required
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            minLength={8}
                        />
                    </div>
                    {error && <div className="alert alert-error">{error}</div>}
                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
                    <Link href="/auth/forgot-password" style={{ color: 'var(--navy-600)', fontWeight: 500 }}>Forgot Password?</Link>
                </div>
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--gray-500)' }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/auth/signup" style={{ color: 'var(--navy-600)', fontWeight: 600 }}>Sign up</Link>
                </div>
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--gray-400)' }}>
                    🔒 Secure login with encrypted password
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="loader"><div className="spinner" /></div>}>
            <LoginForm />
        </Suspense>
    )
}
