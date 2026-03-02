'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'


// Dashboard summary shape matching /api/dashboard/summary
interface DashboardData {
    wallet: { balance: number; milkCreditMl: number }
    recentOrders: { id: string; orderNumber: string; total: number; status: string; createdAt: string }[]
    subscriptions: { id: string; status: string; frequency: string; quantity: number }[]
    referralSummary: { totalEarnedLitres: string; successfulReferrals: number; pendingReferrals: number; referralCode: string } | null
    loyaltyPoints: { balance: number; totalEarned: number } | null
}

export default function DashboardPage() {
    const { user, loading } = useAuth()
    const authFetch = useAuthFetch()
    const [data, setData] = useState<DashboardData | null>(null)

    // Auth redirect handled by dashboard/layout.tsx — no redirect needed here

    useEffect(() => {
        if (!user) return
        // Single BFF call replaces 5 separate API fetches
        authFetch('/api/dashboard/summary').then(d => {
            if (d.success) setData(d.data)
        })
    }, [user, authFetch])

    if (loading || !user) return <div className="loader"><div className="spinner" /></div>

    const activeSub = data?.subscriptions.find(s => s.status === 'ACTIVE')

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <aside className="dashboard-sidebar">
                    <div className="sidebar-user">
                        <div className="name">{user.name || 'User'}</div>
                        <div className="email">{user.email}</div>
                    </div>
                    <ul className="sidebar-menu">
                        <li><Link href="/dashboard" className="active">📊 Dashboard</Link></li>
                        <li><Link href="/dashboard/subscription">📅 Subscription</Link></li>
                        <li><Link href="/dashboard/orders">📦 Orders</Link></li>
                        <li><Link href="/dashboard/wallet">💰 Wallet</Link></li>
                        <li><Link href="/dashboard/loyalty">🏆 Loyalty</Link></li>
                        <li><Link href="/dashboard/addresses">📍 Addresses</Link></li>
                        <li><Link href="/dashboard/profile">👤 Profile</Link></li>
                        {user.role?.toUpperCase() === 'B2C' && <li><Link href="/dashboard/referrals">⭐ Referrals</Link></li>}
                    </ul>
                </aside>

                <main className="dashboard-content">
                    <div className="dashboard-header">
                        <h1>Welcome, {user.name || 'there'} 👋</h1>
                        <p>Your milk delivery overview at a glance</p>
                    </div>

                    <div className="stats-row">
                        <div className="stat-card stat-card-navy">
                            <div className="stat-label">Wallet Balance</div>
                            <div className="stat-value">₹{data?.wallet.balance?.toFixed(2) || '0.00'}</div>
                            <Link href="/dashboard/wallet" style={{ fontSize: '13px', color: 'var(--gold-300)', marginTop: '8px', display: 'inline-block' }}>Recharge →</Link>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Subscription</div>
                            <div className="stat-value" style={{ fontSize: '18px' }}>
                                {activeSub ? (
                                    <span className="status-badge status-active">Active — {activeSub.frequency}</span>
                                ) : (
                                    <span className="status-badge status-paused">No Active Plan</span>
                                )}
                            </div>
                            <Link href="/dashboard/subscription" style={{ fontSize: '13px', color: 'var(--navy-600)', marginTop: '8px', display: 'inline-block' }}>Manage →</Link>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Total Orders</div>
                            <div className="stat-value">{data?.recentOrders.length || 0}</div>
                            <Link href="/dashboard/orders" style={{ fontSize: '13px', color: 'var(--navy-600)', marginTop: '8px', display: 'inline-block' }}>View All →</Link>
                        </div>
                        {data?.loyaltyPoints && (
                            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #F0F7FF 0%, #FFF9ED 100%)', border: '1px solid #E0E7FF' }}>
                                <div className="stat-label">🏆 Loyalty Points</div>
                                <div className="stat-value">{data.loyaltyPoints.balance}</div>
                                <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>= ₹{data.loyaltyPoints.balance} value</div>
                                <Link href="/dashboard/loyalty" style={{ fontSize: '13px', color: 'var(--navy-600)', marginTop: '8px', display: 'inline-block' }}>View Details →</Link>
                            </div>
                        )}
                    </div>

                    {/* Referral Mini Card (B2C only) */}
                    {user.role?.toUpperCase() === 'B2C' && data?.referralSummary && (
                        <div className="card" style={{ padding: '20px', marginBottom: '24px', background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)', border: '1px solid #FDE68A' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>⭐ Referral Program</div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--navy-800)' }}>{data.referralSummary.totalEarnedLitres} earned</div>
                                    <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginTop: '2px' }}>{data.referralSummary.successfulReferrals} rewarded · {data.referralSummary.pendingReferrals} pending</div>
                                </div>
                                <Link href="/dashboard/referrals" className="btn btn-primary btn-sm">View Referrals →</Link>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                        <Link href="/subscriptions" className="btn btn-primary" style={{ justifyContent: 'center' }}>🥛 Start Subscription</Link>
                        <Link href="/dashboard/wallet" className="btn btn-gold" style={{ justifyContent: 'center' }}>💰 Recharge Wallet</Link>
                        <Link href="/dashboard/addresses" className="btn btn-ghost" style={{ justifyContent: 'center' }}>📍 Manage Addresses</Link>
                    </div>

                    {/* Recent Orders */}
                    <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Orders</h3>
                    {data && data.recentOrders.length > 0 ? (
                        <div className="data-table">
                            <table>
                                <thead><tr><th>Order #</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                                <tbody>
                                    {data.recentOrders.map(o => (
                                        <tr key={o.id}>
                                            <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                                            <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td>₹{o.total}</td>
                                            <td><span className={`status-badge status-${o.status?.toLowerCase()}`}>{o.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>
                            No orders yet. <Link href="/subscriptions" style={{ color: 'var(--navy-600)', fontWeight: 600 }}>Start your first subscription</Link>
                        </div>
                    )}
                </main>
            </div>
            <Footer />
        </>
    )
}
