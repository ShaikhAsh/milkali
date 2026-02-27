'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

interface ReferralItem {
    id: string
    maskedEmail: string
    name: string
    deliveredMl: number
    progressPercent: number
    progressDisplay: string
    rewardGranted: boolean
    revoked: boolean
    rewardMl: number
    revokedReason: string
    status: 'PENDING' | 'REWARDED' | 'REVOKED'
}

interface ReferralData {
    referralCode: string
    milkCreditMl: number
    milkCreditDisplay: string
    totalEarnedMl: number
    totalEarnedLitres: string
    successfulReferrals: number
    pendingReferrals: number
    config: {
        thresholdMl: number
        rewardMl: number
        thresholdDisplay: string
        rewardDisplay: string
        isActive: boolean
    }
    stats: {
        totalReferred: number
        rewarded: number
        totalEarnedMl: number
        totalEarnedDisplay: string
        pending: number
    }
    referrals: ReferralItem[]
    myReferralStatus: {
        totalDeliveredMl: number
        progressPercent: number
        progressDisplay: string
        rewardGranted: boolean
    } | null
}

export default function ReferralDashboard() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [data, setData] = useState<ReferralData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState<'code' | 'link' | null>(null)

    // Debug logging (temporary) — trace the redirect source
    useEffect(() => {
        console.log('[ReferralsPage] authLoading:', authLoading, '| user:', user?.email, '| role:', user?.role, '| hasUser:', !!user)
    }, [user, authLoading])

    // B2C role guard — only redirect if user is fully loaded AND role is explicitly NOT 'USER'
    // B2C role guard — allow both 'USER' and 'B2C' roles
    useEffect(() => {
        const allowedRoles = ['USER', 'B2C']
        if (!authLoading && user && user.role && !allowedRoles.includes(user.role)) {
            console.log('[ReferralsPage] REDIRECTING to /dashboard because role is:', user.role)
            router.push('/dashboard')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (!user || (user.role !== 'USER' && user.role !== 'B2C')) return
        authFetch('/api/referral')
            .then(d => {
                if (d.success) setData(d.data)
                else setError(d.error || 'Failed to load')
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false))
    }, [user, authFetch])

    const referralLink = data?.referralCode
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/signup?ref=${data.referralCode}`
        : ''

    const copyToClipboard = async (text: string, type: 'code' | 'link') => {
        await navigator.clipboard.writeText(text)
        setCopied(type)
        setTimeout(() => setCopied(null), 2000)
    }

    const shareWhatsApp = () => {
        const msg = `🥛 Join Milkali and get fresh milk delivered daily! Use my referral code ${data?.referralCode} or sign up here: ${referralLink}`
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    }

    const shareTelegram = () => {
        const msg = `🥛 Join Milkali and get fresh milk delivered daily! Use my referral code ${data?.referralCode}`
        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(msg)}`, '_blank')
    }

    if (authLoading || !user) return <div className="loader"><div className="spinner" /></div>

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <aside className="dashboard-sidebar">
                    <div className="sidebar-user"><div className="name">{user.name || 'User'}</div><div className="email">{user.email}</div></div>
                    <ul className="sidebar-menu">
                        <li><Link href="/dashboard">📊 Dashboard</Link></li>
                        <li><Link href="/dashboard/subscription">📅 Subscription</Link></li>
                        <li><Link href="/dashboard/orders">📦 Orders</Link></li>
                        <li><Link href="/dashboard/wallet">💰 Wallet</Link></li>
                        <li><Link href="/dashboard/loyalty">🏆 Loyalty</Link></li>
                        <li><Link href="/dashboard/addresses">📍 Addresses</Link></li>
                        <li><Link href="/dashboard/profile">👤 Profile</Link></li>
                        <li><Link href="/dashboard/referrals" className="active">⭐ Referrals</Link></li>
                    </ul>
                </aside>
                <main className="dashboard-content">
                    <div className="dashboard-header">
                        <h1>Referral Program</h1>
                        <p>Refer friends, earn free milk when they order {data?.config?.thresholdDisplay || '5.0L'}</p>
                    </div>

                    {loading ? (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="card" style={{ padding: '32px', background: 'linear-gradient(90deg, var(--gray-50) 25%, var(--gray-100) 50%, var(--gray-50) 75%)', animation: 'pulse 1.5s infinite', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ height: '20px', width: `${60 + i * 10}%`, background: 'var(--gray-200)', borderRadius: '4px', marginBottom: '12px' }} />
                                    <div style={{ height: '14px', width: `${40 + i * 5}%`, background: 'var(--gray-200)', borderRadius: '4px' }} />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
                            <div style={{ color: 'var(--error)', fontWeight: 600 }}>{error}</div>
                            <button onClick={() => window.location.reload()} className="btn btn-ghost" style={{ marginTop: '16px' }}>Retry</button>
                        </div>
                    ) : data ? (
                        <>
                            {/* Hero Card */}
                            <div className="card" style={{ padding: '28px', marginBottom: '24px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#fff', borderRadius: 'var(--radius-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#94A3B8', marginBottom: '8px' }}>Your Referral Code</div>
                                        <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '4px', fontFamily: 'monospace', marginBottom: '12px' }}>
                                            {data.referralCode}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button onClick={() => copyToClipboard(data.referralCode, 'code')} className="btn btn-sm" style={{ background: copied === 'code' ? '#10B981' : 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', fontSize: '12px' }}>
                                                {copied === 'code' ? '✓ Copied!' : '📋 Copy Code'}
                                            </button>
                                            <button onClick={() => copyToClipboard(referralLink, 'link')} className="btn btn-sm" style={{ background: copied === 'link' ? '#10B981' : 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', fontSize: '12px' }}>
                                                {copied === 'link' ? '✓ Copied!' : '🔗 Copy Link'}
                                            </button>
                                            <button onClick={shareWhatsApp} className="btn btn-sm" style={{ background: '#25D366', color: '#fff', border: 'none', fontSize: '12px' }}>
                                                WhatsApp
                                            </button>
                                            <button onClick={shareTelegram} className="btn btn-sm" style={{ background: '#0088CC', color: '#fff', border: 'none', fontSize: '12px' }}>
                                                Telegram
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '32px', fontWeight: 800 }}>{data.totalEarnedLitres}</div>
                                        <div style={{ fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase' }}>Total Earned</div>
                                        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                                            Milk Credit: {data.milkCreditDisplay}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--navy-800)' }}>{data.stats.totalReferred}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Referred</div>
                                </div>
                                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981' }}>{data.stats.rewarded}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rewarded</div>
                                </div>
                                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gold-700)' }}>{data.stats.pending}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending</div>
                                </div>
                                <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--navy-800)' }}>{data.stats.totalEarnedDisplay}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Earned</div>
                                </div>
                            </div>

                            {/* How it Works */}
                            <div className="card" style={{ padding: '20px', marginBottom: '24px', background: 'var(--blue-50, #EFF6FF)', border: '1px solid #BFDBFE' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '8px' }}>💡 How It Works</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '13px', color: 'var(--gray-600)' }}>
                                    <div>1️⃣ Share your code with friends</div>
                                    <div>2️⃣ They sign up and order milk</div>
                                    <div>3️⃣ Once they receive {data.config.thresholdDisplay}, you earn {data.config.rewardDisplay} free!</div>
                                </div>
                            </div>

                            {/* Referral List Table */}
                            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy-800)', marginBottom: '12px' }}>Your Referrals</h3>

                            {data.referrals.length > 0 ? (
                                <div className="data-table" style={{ marginBottom: '24px' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Friend</th>
                                                <th>Delivered</th>
                                                <th>Progress</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.referrals.map(r => (
                                                <tr key={r.id}>
                                                    <td style={{ fontWeight: 600, fontSize: '13px' }}>{r.maskedEmail}</td>
                                                    <td style={{ fontSize: '13px' }}>{r.progressDisplay}</td>
                                                    <td>
                                                        <div style={{ background: 'var(--gray-100)', borderRadius: '99px', height: '8px', width: '100px', overflow: 'hidden' }}>
                                                            <div style={{
                                                                height: '100%',
                                                                width: `${r.progressPercent}%`,
                                                                borderRadius: '99px',
                                                                background: r.status === 'REVOKED' ? '#EF4444' : r.status === 'REWARDED' ? '#10B981' : 'var(--gold-500)',
                                                                transition: 'width 0.5s ease'
                                                            }} />
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: 'var(--gray-400)', marginTop: '2px' }}>{r.progressPercent}%</div>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge status-${r.status.toLowerCase()}`} style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '99px',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            background: r.status === 'REWARDED' ? '#D1FAE5' : r.status === 'REVOKED' ? '#FEE2E2' : '#FEF3C7',
                                                            color: r.status === 'REWARDED' ? '#065F46' : r.status === 'REVOKED' ? '#991B1B' : '#92400E',
                                                        }}>
                                                            {r.status === 'REWARDED' ? '✓ Rewarded' : r.status === 'REVOKED' ? '✕ Revoked' : '⏳ Pending'}
                                                        </span>
                                                        {r.revoked && r.revokedReason && (
                                                            <div style={{ fontSize: '10px', color: '#EF4444', marginTop: '2px' }}>{r.revokedReason}</div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)', marginBottom: '24px' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>No referrals yet</div>
                                    <div style={{ fontSize: '13px' }}>Share your code above to start earning free milk!</div>
                                </div>
                            )}

                            {/* My Referral Status */}
                            {data.myReferralStatus && (
                                <div className="card" style={{ padding: '20px' }}>
                                    <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy-800)', marginBottom: '12px' }}>My Referral Progress</h3>
                                    <div style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '8px' }}>
                                        You were referred! Your referrer earns {data.config.rewardDisplay} when you receive {data.config.thresholdDisplay}.
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ flex: 1, background: 'var(--gray-100)', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${data.myReferralStatus.progressPercent}%`,
                                                borderRadius: '99px',
                                                background: data.myReferralStatus.rewardGranted ? '#10B981' : 'var(--gold-500)',
                                                transition: 'width 0.5s ease'
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-800)' }}>
                                            {data.myReferralStatus.progressDisplay}
                                        </span>
                                    </div>
                                    {data.myReferralStatus.rewardGranted && (
                                        <div style={{ marginTop: '8px', fontSize: '13px', color: '#10B981', fontWeight: 600 }}>
                                            ✓ Your referrer has been rewarded!
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : null}
                </main>
            </div>
            <Footer />
        </>
    )
}
