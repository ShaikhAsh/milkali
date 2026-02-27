'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

interface LoyaltyData {
    balance: number
    totalEarned: number
    totalRedeemed: number
    totalReversed: number
    transactions: {
        id: string
        type: string
        points: number
        balanceAfter: number
        description: string
        createdAt: string
    }[]
}

export default function LoyaltyPage() {
    const { user, loading } = useAuth()
    const authFetch = useAuthFetch()
    const [data, setData] = useState<LoyaltyData | null>(null)

    useEffect(() => {
        if (user) {
            authFetch('/api/loyalty').then(d => d.success && setData(d.data))
        }
    }, [user, authFetch])

    if (loading || !user) return <div className="loader"><div className="spinner" /></div>

    const typeLabels: Record<string, string> = {
        CREDIT: '✅ Earned',
        REVERSAL: '↩️ Reversed',
        REDEMPTION: '🎁 Redeemed',
        ADMIN_CREDIT: '⭐ Admin Credit',
        ADMIN_DEBIT: '❌ Admin Debit',
    }

    const typeColors: Record<string, string> = {
        CREDIT: 'var(--success)',
        ADMIN_CREDIT: 'var(--success)',
        REVERSAL: 'var(--error)',
        ADMIN_DEBIT: 'var(--error)',
        REDEMPTION: 'var(--gold-700)',
    }

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
                        <li><Link href="/dashboard/loyalty" className="active">🏆 Loyalty</Link></li>
                        <li><Link href="/dashboard/addresses">📍 Addresses</Link></li>
                        <li><Link href="/dashboard/profile">👤 Profile</Link></li>
                        {user.role === 'USER' && <li><Link href="/dashboard/referrals">⭐ Referrals</Link></li>}
                    </ul>
                </aside>
                <main className="dashboard-content">
                    <div className="dashboard-header">
                        <h1>Loyalty Points</h1>
                        <p>Earn points on every delivery. 1 point = ₹1 value.</p>
                    </div>

                    {/* Points Balance */}
                    <div className="stats-row">
                        <div className="stat-card stat-card-navy">
                            <div className="stat-label">Points Balance</div>
                            <div className="stat-value" style={{ fontSize: '40px' }}>{data?.balance || 0}</div>
                            <div style={{ fontSize: '12px', color: 'var(--gold-300)', marginTop: '4px' }}>= ₹{data?.balance || 0} value</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Total Earned</div>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>{data?.totalEarned || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Redeemed</div>
                            <div className="stat-value" style={{ color: 'var(--gold-700)' }}>{data?.totalRedeemed || 0}</div>
                        </div>
                    </div>

                    {/* How it works */}
                    <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, #F0F7FF 0%, #FFF9ED 100%)', border: '1px solid #E0E7FF' }}>
                        <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy-800)', marginBottom: '16px' }}>How It Works</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                            <div style={{ textAlign: 'center', padding: '16px' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥛</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '4px' }}>Get Milk Delivered</div>
                                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Points are awarded after successful delivery</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '16px' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '4px' }}>Earn 2 pts / litre</div>
                                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Every litre of milk delivered = 2 loyalty points</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '16px' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '4px' }}>1 Point = ₹1</div>
                                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Redeem points for discounts (coming soon!)</div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy-800)', marginBottom: '16px' }}>Points History</h3>
                    {data?.transactions && data.transactions.length > 0 ? (
                        <div className="data-table">
                            <table>
                                <thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Points</th><th>Balance</th></tr></thead>
                                <tbody>
                                    {data.transactions.map(t => (
                                        <tr key={t.id}>
                                            <td>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td>{t.description}</td>
                                            <td><span className="status-badge" style={{ background: `${typeColors[t.type] || 'var(--gray-500)'}20`, color: typeColors[t.type] || 'var(--gray-500)' }}>{typeLabels[t.type] || t.type}</span></td>
                                            <td style={{ fontWeight: 700, color: ['CREDIT', 'ADMIN_CREDIT'].includes(t.type) ? 'var(--success)' : 'var(--error)' }}>
                                                {['CREDIT', 'ADMIN_CREDIT'].includes(t.type) ? '+' : '-'}{t.points}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{t.balanceAfter}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>
                            No points earned yet. Points are awarded automatically after each delivery! 🥛
                        </div>
                    )}
                </main>
            </div>
            <Footer />
        </>
    )
}
