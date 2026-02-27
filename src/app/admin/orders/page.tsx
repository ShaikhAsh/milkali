'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

interface Order {
    id: string
    orderNumber: string
    status: string
    total: number
    paymentMethod: string
    paymentStatus: string
    createdAt: string
    deliveryDate: string | null
    user?: { name: string; email: string }
    items: { id: string; quantity: number; price: number; variant: { name: string; size: string } }[]
    address?: { label: string; line1: string; city: string; pincode: string }
    delivery?: { status: string; scheduledSlot: string }
}

const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const

export default function AdminOrdersPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [orders, setOrders] = useState<Order[]>([])
    const [filter, setFilter] = useState('ALL')
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        if (!loading && !user) router.push('/auth/login')
        if (!loading && user && user.role !== 'ADMIN') router.push('/dashboard')
    }, [user, loading, router])

    const fetchOrders = useCallback(() => {
        if (!user || user.role !== 'ADMIN') return
        const url = filter === 'ALL' ? '/api/admin?section=orders' : `/api/admin?section=orders&status=${filter}`
        authFetch(url).then(d => d.success && setOrders(d.data || []))
    }, [user, filter, authFetch])

    useEffect(() => { fetchOrders() }, [fetchOrders])

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdating(orderId)
        await authFetch('/api/admin', {
            method: 'POST',
            body: JSON.stringify({ action: 'update-order-status', orderId, status: newStatus })
        })
        fetchOrders()
        setUpdating(null)
    }

    if (loading || !user) return <div className="loader"><div className="spinner" /></div>
    if (user.role !== 'ADMIN') return null

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <aside className="dashboard-sidebar">
                    <div className="sidebar-user">
                        <div className="name">🔑 Admin</div>
                        <div className="email">{user.email}</div>
                    </div>
                    <ul className="sidebar-menu">
                        <li><Link href="/admin">📊 Overview</Link></li>
                        <li><Link href="/admin/orders" className="active">📦 Orders</Link></li>
                        <li><Link href="/admin/users">👥 Users</Link></li>
                        <li><Link href="/admin/subscriptions">📅 Subscriptions</Link></li>
                        <li><Link href="/admin/deliveries">🚚 Deliveries</Link></li>
                        <li><Link href="/admin/coupons">🏷️ Coupons</Link></li>
                        <li><Link href="/admin/audit">📋 Audit Logs</Link></li>
                        <li><Link href="/dashboard" style={{ opacity: 0.6 }}>← Back to User</Link></li>
                    </ul>
                </aside>
                <main className="dashboard-content">
                    <div className="dashboard-header">
                        <h1>Order Management</h1>
                        <p>View, filter, and update all customer orders</p>
                    </div>

                    {/* Filter tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        {STATUSES.map(s => (
                            <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}>
                                {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
                            </button>
                        ))}
                    </div>

                    {orders.length > 0 ? (
                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Order #</th>
                                        <th>Customer</th>
                                        <th>Date</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td style={{ fontWeight: 600, fontSize: '13px' }}>{order.orderNumber}</td>
                                            <td style={{ fontSize: '13px' }}>
                                                <div>{order.user?.name || '—'}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{order.user?.email}</div>
                                            </td>
                                            <td style={{ fontSize: '13px' }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td style={{ fontSize: '13px' }}>
                                                {order.items.map(i => `${i.variant.name} ×${i.quantity}`).join(', ')}
                                            </td>
                                            <td style={{ fontWeight: 700 }}>₹{order.total}</td>
                                            <td>
                                                <span className={`status-badge ${order.paymentStatus === 'PAID' ? 'status-active' : 'status-pending'}`} style={{ fontSize: '11px' }}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${order.status?.toLowerCase()}`}>{order.status}</span>
                                            </td>
                                            <td>
                                                {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                                                    <select
                                                        disabled={updating === order.id}
                                                        value=""
                                                        onChange={e => e.target.value && handleStatusChange(order.id, e.target.value)}
                                                        className="form-input"
                                                        style={{ fontSize: '12px', padding: '4px 8px', minWidth: '120px' }}
                                                    >
                                                        <option value="">Update…</option>
                                                        {order.status === 'PENDING' && <option value="CONFIRMED">Confirm</option>}
                                                        {order.status === 'CONFIRMED' && <option value="OUT_FOR_DELIVERY">Out for Delivery</option>}
                                                        {order.status === 'OUT_FOR_DELIVERY' && <option value="DELIVERED">Mark Delivered</option>}
                                                        <option value="CANCELLED">Cancel</option>
                                                    </select>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>
                            No orders found for the selected filter.
                        </div>
                    )}
                </main>
            </div>
            <Footer />
        </>
    )
}
