'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AdminSidebar from '@/components/AdminSidebar'
import Link from 'next/link'

interface AuditEntry {
    id: string
    action: string
    entity: string
    entityId: string | null
    details: string | null
    oldValue: string | null
    newValue: string | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: string
    user?: { name: string; email: string } | null
}

export default function AdminAuditPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [logs, setLogs] = useState<AuditEntry[]>([])
    const [expandedId, setExpandedId] = useState<string | null>(null)

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

    const tryFormatJson = (s: string | null) => {
        if (!s) return null
        try { return JSON.stringify(JSON.parse(s), null, 2) } catch { return s }
    }

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <AdminSidebar userEmail={user.email} />
                <main className="dashboard-content">
                    <div className="dashboard-header"><h1>Audit Logs</h1><p>System activity trail — payments, orders, cron, security events</p></div>

                    {logs.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <div className="data-table">
                                <table>
                                    <thead><tr><th style={{ width: '28px' }}></th><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
                                    <tbody>
                                        {logs.map(l => {
                                            const isExpanded = expandedId === l.id
                                            const hasExtra = l.oldValue || l.newValue || l.ipAddress || l.userAgent || l.details
                                            return (
                                                <>
                                                    <tr key={l.id} onClick={() => hasExtra && setExpandedId(isExpanded ? null : l.id)}
                                                        style={{ cursor: hasExtra ? 'pointer' : 'default' }}>
                                                        <td style={{ fontSize: '14px', textAlign: 'center' }}>{hasExtra ? (isExpanded ? '▼' : '▶') : ''}</td>
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
                                                    {isExpanded && (
                                                        <tr key={`${l.id}-detail`}>
                                                            <td colSpan={6} style={{ padding: 0 }}>
                                                                <div style={{ padding: '16px 20px', background: 'var(--gray-50, #f9fafb)', borderTop: '1px solid var(--gray-200)', fontSize: '13px' }}>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '900px' }}>
                                                                        {l.details && (
                                                                            <div style={{ gridColumn: '1 / -1' }}>
                                                                                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--gray-500)' }}>Details</strong>
                                                                                <pre style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                                                                                    {tryFormatJson(l.details)}
                                                                                </pre>
                                                                            </div>
                                                                        )}
                                                                        {l.oldValue && (
                                                                            <div>
                                                                                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--gray-500)' }}>Old Value</strong>
                                                                                <pre style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                                                                                    {tryFormatJson(l.oldValue)}
                                                                                </pre>
                                                                            </div>
                                                                        )}
                                                                        {l.newValue && (
                                                                            <div>
                                                                                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--gray-500)' }}>New Value</strong>
                                                                                <pre style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                                                                                    {tryFormatJson(l.newValue)}
                                                                                </pre>
                                                                            </div>
                                                                        )}
                                                                        {(l.ipAddress || l.userAgent) && (
                                                                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '28px', fontSize: '12px', color: 'var(--gray-500)' }}>
                                                                                {l.ipAddress && <span><strong>IP:</strong> {l.ipAddress}</span>}
                                                                                {l.userAgent && <span style={{ maxWidth: '600px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><strong>UA:</strong> {l.userAgent}</span>}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
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
