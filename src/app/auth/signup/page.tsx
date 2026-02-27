'use client'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'

function SignupForm() {
    const { user, signup } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [referralCode, setReferralCode] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [referralApplied, setReferralApplied] = useState(false)

    const redirectUrl = searchParams.get('redirect') || '/dashboard'

    // Auto-fill referral code from URL param
    useEffect(() => {
        const ref = searchParams.get('ref')
        if (ref) {
            setReferralCode(ref.toUpperCase().trim())
            setReferralApplied(true)
        }
    }, [searchParams])

    useEffect(() => {
        if (user) router.push(redirectUrl)
    }, [user, router, redirectUrl])

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        const res = await signup(email, password, name, referralCode || undefined)
        if (res.success) {
            router.push(redirectUrl)
        } else {
            setError(res.message || 'Signup failed')
        }
        setLoading(false)
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <Link href="/" style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
                    <img src="/images/logo.svg" alt="Milkali" style={{ height: '52px' }} />
                </Link>

                <h2>Create Account</h2>
                <p className="auth-subtitle">Sign up to start your fresh milk journey</p>
                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            className="form-input"
                            type="text"
                            required
                            placeholder="Your full name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            className="form-input"
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            className="form-input"
                            type="password"
                            required
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            minLength={8}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Referral Code <span style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. MILKAB12"
                            value={referralCode}
                            onChange={e => setReferralCode(e.target.value.toUpperCase())}
                            maxLength={12}
                            style={{ letterSpacing: '2px', fontWeight: 600 }}
                        />
                        {referralCode && (
                            <div style={{ fontSize: '11px', color: 'var(--gold-700)', marginTop: '4px' }}>
                                {referralApplied
                                    ? '✅ Referral code applied from your invite link!'
                                    : '🎁 Referral code will be applied when you create your account'}
                            </div>
                        )}
                    </div>
                    {error && <div className="alert alert-error">{error}</div>}
                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--gray-500)' }}>
                    Already have an account?{' '}
                    <Link href="/auth/login" style={{ color: 'var(--navy-600)', fontWeight: 600 }}>Log in</Link>
                </div>
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--gray-400)' }}>
                    🔒 Your password is securely encrypted
                </div>
            </div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="loader"><div className="spinner" /></div>}>
            <SignupForm />
        </Suspense>
    )
}
