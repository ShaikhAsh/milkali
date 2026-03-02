'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AdminSidebar from '@/components/AdminSidebar'
import Link from 'next/link'

interface Delivery {
    id: string
    status: string
    scheduledDate: string
    scheduledSlot: string | null
    deliveredAt: string | null
    failureReason: string | null
    order?: {
        orderNumber: string
        total: number
        user?: { name: string; email: string }
        address?: { line1: string; pincode: string }
        items?: { quantity: number; variant: { name: string } }[]
    }
    deliveryPartner?: { name: string } | null
}

export default function AdminDeliveriesPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [deliveries, setDeliveries] = useState<Delivery[]>([])

    useEffect(() => {
        if (!loading && !user) router.push('/auth/login')
        if (!loading && user && user.role !== 'ADMIN') router.push('/dashboard')
    }, [user, loading, router])

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') return
        authFetch('/api/admin?section=deliveries').then(d => d.success && setDeliveries(d.data || []))
    }, [user, authFetch])

    if (loading || !user || user.role !== 'ADMIN') return <div className="loader"><div className="spinner" /></div>

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <AdminSidebar userEmail={user.email} />
                <main className="dashboard-content">
                    <div className="dashboard-header"><h1>Delivery Schedule</h1><p>Track all scheduled and completed deliveries</p></div>

                    {deliveries.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <div className="data-table">
                                <table>
                                    <thead><tr><th>Date</th><th>Slot</th><th>Order #</th><th>Customer</th><th>Items</th><th>Address</th><th>Partner</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {deliveries.map(d => (
                                            <tr key={d.id}>
                                                <td style={{ fontSize: '13px', fontWeight: 600 }}>{new Date(d.scheduledDate).toLocaleDateString('en-IN')}</td>
                                                <td style={{ fontSize: '13px' }}>{d.scheduledSlot || '—'}</td>
                                                <td style={{ fontSize: '13px' }}>{d.order?.orderNumber || '—'}</td>
                                                <td style={{ fontSize: '13px' }}>{d.order?.user?.name || d.order?.user?.email || '—'}</td>
                                                <td style={{ fontSize: '13px' }}>
                                                    {d.order?.items?.map(i => `${i.variant.name} ×${i.quantity}`).join(', ') || '—'}
                                                </td>
                                                <td style={{ fontSize: '12px' }}>{d.order?.address ? `${d.order.address.line1} - ${d.order.address.pincode}` : '—'}</td>
                                                <td style={{ fontSize: '13px' }}>{d.deliveryPartner?.name || 'Unassigned'}</td>
                                                <td><span className={`status-badge status-${d.status?.toLowerCase()}`}>{d.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>No deliveries scheduled.</div>
                    )}
                </main>
            </div>
            <Footer />
        </>
    )
}
