'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

interface AuditEntry {
    id: string
    action: string
    entity: string
    entityId: string | null
    details: string | null
    createdAt: string
    user?: { name: string; email: string } | null
}

export default function AdminAuditPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [logs, setLogs] = useState<AuditEntry[]>([])

    useEffect(() => {
        if (!loading && !user) router.push('/auth/login')
        if (!loading && user && user.role !== 'ADMIN') router.push('/dashboard')
    }, [user, loading, router])

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') return
        authFetch('/api/admin?section=audit-logs').then(d => d.success && setLogs(d.data || []))
    }, [user, authFetch])

    if (loading || !user || user.role !== 'ADMIN') return <div className="loader"><div className="spinner" /></div>

    const actionColors: Record<string, string> = {
        WALLET_RECHARGE: 'status-active',
        WEBHOOK_WALLET_CREDIT: 'status-active',
        ORDER_CREATED: 'status-pending',
        ORDER_CANCELLED: 'status-cancelled',
        CRON_ORDER_CREATED: 'status-pending',
        CRON_RUN_COMPLETE: 'status-active',
        SUBSCRIPTION_AUTO_PAUSED: 'status-cancelled',
    }

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
                        <li><Link href="/admin/subscriptions">📅 Subscriptions</Link></li>
                        <li><Link href="/admin/deliveries">🚚 Deliveries</Link></li>
                        <li><Link href="/admin/coupons">🏷️ Coupons</Link></li>
                        <li><Link href="/admin/audit" className="active">📋 Audit Logs</Link></li>
                        <li><Link href="/dashboard" style={{ opacity: 0.6 }}>← Back to User</Link></li>
                    </ul>
                </aside>
                <main className="dashboard-content">
                    <div className="dashboard-header"><h1>Audit Logs</h1><p>System activity trail — payments, orders, cron, security events</p></div>

                    {logs.length > 0 ? (
                        <div className="data-table">
                            <table>
                                <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
                                <tbody>
                                    {logs.map(l => (
                                        <tr key={l.id}>
                                            <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                                                {new Date(l.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td style={{ fontSize: '13px' }}>{l.user?.name || l.user?.email || 'System'}</td>
                                            <td><span className={`status-badge ${actionColors[l.action] || ''}`} style={{ fontSize: '11px' }}>{l.action}</span></td>
                                            <td style={{ fontSize: '13px' }}>{l.entity}{l.entityId ? ` #${l.entityId.slice(0, 8)}` : ''}</td>
                                            <td style={{ fontSize: '12px', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.details || ''}>
                                                {l.details || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>No audit logs found.</div>
                    )}
                </main>
            </div>
            <Footer />
        </>
    )
}
