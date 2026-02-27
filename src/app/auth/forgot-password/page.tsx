'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'forgot-password', email }),
            })
            const data = await res.json()
            if (data.success) {
                setSent(true)
            } else {
                setError(data.error || 'Something went wrong.')
            }
        } catch {
            setError('Network error. Please try again.')
        }
        setLoading(false)
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <Link href="/" style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
                    <img src="/images/logo.svg" alt="Milkali" style={{ height: '52px' }} />
                </Link>

                {sent ? (
                    <>
                        <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '16px' }}>📧</div>
                        <h2 style={{ textAlign: 'center' }}>Check Your Email</h2>
                        <p className="auth-subtitle" style={{ textAlign: 'center' }}>
                            If an account with <strong>{email}</strong> exists, we&apos;ve sent a password reset link.
                        </p>
                        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gray-400)', marginTop: '16px' }}>
                            The link expires in 15 minutes. Check your spam folder if you don&apos;t see it.
                        </p>
                        <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <Link href="/auth/login" className="btn btn-primary btn-block btn-lg">
                                Back to Login
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <h2>Forgot Password?</h2>
                        <p className="auth-subtitle">Enter your email and we&apos;ll send you a reset link</p>
                        <form onSubmit={handleSubmit}>
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
                            {error && <div className="alert alert-error">{error}</div>}
                            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--gray-500)' }}>
                            Remember your password?{' '}
                            <Link href="/auth/login" style={{ color: 'var(--navy-600)', fontWeight: 600 }}>Sign in</Link>
                        </div>
                    </>
                )}

                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--gray-400)' }}>
                    🔒 We never share your email with third parties
                </div>
            </div>
        </div>
    )
}
