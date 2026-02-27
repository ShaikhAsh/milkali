'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const tokenParam = searchParams.get('token') || ''
    const emailParam = searchParams.get('email') || ''

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (!tokenParam || !emailParam) {
            setError('Invalid reset link. Please request a new one.')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reset-password',
                    token: tokenParam,
                    email: emailParam,
                    newPassword: password,
                }),
            })
            const data = await res.json()
            if (data.success) {
                setSuccess(true)
            } else {
                setError(data.error || 'Something went wrong.')
            }
        } catch {
            setError('Network error. Please try again.')
        }
        setLoading(false)
    }

    if (!tokenParam || !emailParam) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <Link href="/" style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
                        <img src="/images/logo.svg" alt="Milkali" style={{ height: '52px' }} />
                    </Link>
                    <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <h2 style={{ textAlign: 'center' }}>Invalid Reset Link</h2>
                    <p className="auth-subtitle" style={{ textAlign: 'center' }}>
                        This password reset link is invalid or has expired.
                    </p>
                    <Link href="/auth/forgot-password" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '24px' }}>
                        Request a New Link
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <Link href="/" style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
                    <img src="/images/logo.svg" alt="Milkali" style={{ height: '52px' }} />
                </Link>

                {success ? (
                    <>
                        <div style={{ textAlign: 'center', fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <h2 style={{ textAlign: 'center' }}>Password Reset!</h2>
                        <p className="auth-subtitle" style={{ textAlign: 'center' }}>
                            Your password has been updated successfully.
                        </p>
                        <Link href="/auth/login" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '24px' }}>
                            Sign In with New Password
                        </Link>
                    </>
                ) : (
                    <>
                        <h2>Set New Password</h2>
                        <p className="auth-subtitle">Enter your new password below</p>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    required
                                    placeholder="Minimum 8 characters"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    minLength={8}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    required
                                    placeholder="Re-enter your password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    minLength={8}
                                />
                            </div>
                            {error && <div className="alert alert-error">{error}</div>}
                            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}

                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--gray-400)' }}>
                    🔒 Your password is encrypted and securely stored
                </div>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="loader"><div className="spinner" /></div>}>
            <ResetPasswordForm />
        </Suspense>
    )
}
