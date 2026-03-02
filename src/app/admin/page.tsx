'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AdminSidebar from '@/components/AdminSidebar'
import Link from 'next/link'

interface Stats {
    totalUsers: number
    totalOrders: number
    activeSubscriptions: number
    totalRevenue: number
    pendingB2B: number
}

interface RecentOrder {
    id: string
    orderNumber: string
    status: string
    total: number
    createdAt: string
    user?: { name: string; email: string }
}

export default function AdminDashboard() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [stats, setStats] = useState<Stats | null>(null)
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
    const [error, setError] = useState('')

    useEffect(() => {
        if (!loading && !user) router.push('/auth/login')
        if (!loading && user && user.role !== 'ADMIN') router.push('/dashboard')
    }, [user, loading, router])

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') return
        authFetch('/api/admin?section=overview').then(d => {
            if (d.success) {
                setStats(d.data.stats)
                setRecentOrders(d.data.recentOrders || [])
            } else {
                setError(d.error || 'Failed to load admin data')
            }
        })
    }, [user, authFetch])

    if (loading || !user) return <div className="loader"><div className="spinner" /></div>
    if (user.role !== 'ADMIN') return null

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <AdminSidebar userEmail={user.email} />
                <main className="dashboard-content">
                    <div className="dashboard-header">
                        <h1>Admin Dashboard</h1>
                        <p>Platform overview and management</p>
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    {stats && (
                        <div className="stats-row">
                            <div className="stat-card stat-card-navy">
                                <div className="stat-label">Total Revenue</div>
                                <div className="stat-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Total Users</div>
                                <div className="stat-value">{stats.totalUsers}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Total Orders</div>
                                <div className="stat-value">{stats.totalOrders}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Active Subscriptions</div>
                                <div className="stat-value">{stats.activeSubscriptions}</div>
                            </div>
                            {stats.pendingB2B > 0 && (
                                <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
                                    <div className="stat-label">Pending B2B</div>
                                    <div className="stat-value">{stats.pendingB2B}</div>
                                </div>
                            )}
                        </div>
                    )}

                    <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy-800)', marginBottom: '16px', marginTop: '32px' }}>Recent Orders</h3>
                    {recentOrders.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <div className="data-table">
                                <table>
                                    <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {recentOrders.map(o => (
                                            <tr key={o.id}>
                                                <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                                                <td>{o.user?.name || o.user?.email || '—'}</td>
                                                <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                                                <td>₹{o.total}</td>
                                                <td><span className={`status-badge status-${o.status?.toLowerCase()}`}>{o.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>No orders yet.</div>
                    )}
                </main>
            </div>
            <Footer />
        </>
    )
}
