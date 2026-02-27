'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

interface Sub {
    id: string
    status: string
    frequency: string
    quantity: number
    pricePerUnit: number
    startDate: string
    nextDelivery: string | null
    user?: { name: string; email: string }
    variant?: { name: string; size: string; product?: { name: string } }
    address?: { line1: string; pincode: string }
}

export default function AdminSubscriptionsPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [subs, setSubs] = useState<Sub[]>([])
    const [filter, setFilter] = useState('')

    useEffect(() => {
        if (!loading && !user) router.push('/auth/login')
        if (!loading && user && user.role !== 'ADMIN') router.push('/dashboard')
    }, [user, loading, router])

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') return
        const url = filter ? `/api/admin?section=subscriptions&status=${filter}` : '/api/admin?section=subscriptions'
        authFetch(url).then(d => d.success && setSubs(d.data || []))
    }, [user, filter, authFetch])

    if (loading || !user || user.role !== 'ADMIN') return <div className="loader"><div className="spinner" /></div>

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <aside className="dashboard-sidebar">
                    <div className="sidebar-user"><div className="name">🔑 Admin</div><div className="email">{user.email}</div></div>
                    <ul className="sidebar-menu">
                        <li><Link href="/admin">📊 Overview</Link></li>
                        <li><Link href="/admin/orders">📦 Orders</Link></li>
                        <li><Link href="/admin/users">👥 Users</Link></li>
                        <li><Link href="/admin/subscriptions" className="active">📅 Subscriptions</Link></li>
                        <li><Link href="/admin/deliveries">🚚 Deliveries</Link></li>
                        <li><Link href="/admin/coupons">🏷️ Coupons</Link></li>
                        <li><Link href="/admin/audit">📋 Audit Logs</Link></li>
                        <li><Link href="/dashboard" style={{ opacity: 0.6 }}>← Back to User</Link></li>
                    </ul>
                </aside>
                <main className="dashboard-content">
                    <div className="dashboard-header"><h1>Subscriptions</h1><p>View all customer subscriptions</p></div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        {['', 'ACTIVE', 'PAUSED', 'CANCELLED'].map(s => (
                            <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}>
                                {s || 'All'}
                            </button>
                        ))}
                    </div>

                    {subs.length > 0 ? (
                        <div className="data-table">
                            <table>
                                <thead><tr><th>Customer</th><th>Product</th><th>Qty</th><th>Frequency</th><th>Daily Cost</th><th>Next Delivery</th><th>Status</th></tr></thead>
                                <tbody>
                                    {subs.map(s => (
                                        <tr key={s.id}>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.user?.name || '—'}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{s.user?.email}</div>
                                            </td>
                                            <td style={{ fontSize: '13px' }}>{s.variant?.product?.name || s.variant?.name} ({s.variant?.size})</td>
                                            <td>{s.quantity}</td>
                                            <td>{s.frequency}</td>
                                            <td style={{ fontWeight: 700 }}>₹{(s.pricePerUnit * s.quantity).toFixed(2)}</td>
                                            <td style={{ fontSize: '13px' }}>{s.nextDelivery ? new Date(s.nextDelivery).toLocaleDateString('en-IN') : '—'}</td>
                                            <td><span className={`status-badge status-${s.status?.toLowerCase()}`}>{s.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>No subscriptions found.</div>
                    )}
                </main>
            </div>
            <Footer />
        </>
    )
}
