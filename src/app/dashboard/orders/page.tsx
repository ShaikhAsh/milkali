'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import OrderSupportButton from '@/components/support/OrderSupportButton'

interface OrderItem {
    id: string
    quantity: number
    price: number
    total: number
    variant: { name: string; size: string; product?: { name: string } }
}

interface Order {
    id: string
    orderNumber: string
    status: string
    total: number
    subtotal: number
    discount: number
    paymentMethod: string
    paymentStatus: string
    createdAt: string
    deliveryDate: string | null
    items: OrderItem[]
    address?: { label: string; line1: string; city: string; pincode: string }
    delivery?: { status: string; scheduledSlot: string }
}

export default function OrdersPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [orders, setOrders] = useState<Order[]>([])
    const [filter, setFilter] = useState('ALL')
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [cancelling, setCancelling] = useState<string | null>(null)

    // Auth redirect handled by dashboard/layout.tsx

    const fetchOrders = useCallback(() => {
        if (!user) return
        const url = filter === 'ALL' ? '/api/orders' : `/api/orders?status=${filter}`
        authFetch(url).then(d => d.success && setOrders(d.data || []))
    }, [user, filter, authFetch])

    useEffect(() => { fetchOrders() }, [fetchOrders])

    const handleCancel = async (orderId: string) => {
        if (!confirm('Cancel this order? Wallet payment will be refunded.')) return
        setCancelling(orderId)
        const res = await authFetch('/api/orders', {
            method: 'PATCH',
            body: JSON.stringify({ orderId, action: 'cancel' })
        })
        if (res.success) fetchOrders()
        setCancelling(null)
    }

    if (loading || !user) return <div className="loader"><div className="spinner" /></div>

    const statusColors: Record<string, string> = {
        PENDING: 'status-pending', CONFIRMED: 'status-active', DELIVERED: 'status-active',
        CANCELLED: 'status-cancelled', OUT_FOR_DELIVERY: 'status-pending',
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
                        <li><Link href="/dashboard/orders" className="active">📦 Orders</Link></li>
                        <li><Link href="/dashboard/wallet">💰 Wallet</Link></li>
                        <li><Link href="/dashboard/loyalty">🏆 Loyalty</Link></li>
                        <li><Link href="/dashboard/addresses">📍 Addresses</Link></li>
                        <li><Link href="/dashboard/profile">👤 Profile</Link></li>
                        {user.role === 'USER' && <li><Link href="/dashboard/referrals">⭐ Referrals</Link></li>}
                    </ul>
                </aside>
                <main className="dashboard-content">
                    <div className="dashboard-header">
                        <h1>My Orders</h1>
                        <p>Track and manage your milk deliveries</p>
                    </div>

                    {/* Filter tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        {['ALL', 'CONFIRMED', 'DELIVERED', 'CANCELLED'].map(s => (
                            <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}>
                                {s === 'ALL' ? 'All Orders' : s.charAt(0) + s.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    {orders.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {orders.map(order => (
                                <div key={order.id} className="card" style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--navy-800)' }}>{order.orderNumber}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '4px' }}>
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                {order.deliveryDate && ` • Delivery: ${new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--navy-800)' }}>₹{order.total}</span>
                                            <span className={`status-badge ${statusColors[order.status] || ''}`}>{order.status}</span>
                                        </div>
                                    </div>

                                    {/* Toggle details */}
                                    <button onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--navy-600)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', padding: '8px 0 0', fontFamily: 'inherit' }}>
                                        {expandedId === order.id ? '▲ Hide Details' : '▼ View Details'}
                                    </button>

                                    {expandedId === order.id && (
                                        <div style={{ marginTop: '16px', borderTop: '1px solid var(--gray-100)', paddingTop: '16px' }}>
                                            <div className="data-table">
                                                <table>
                                                    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                                                    <tbody>
                                                        {order.items.map(item => (
                                                            <tr key={item.id}>
                                                                <td>{item.variant.product?.name || item.variant.name} ({item.variant.size})</td>
                                                                <td>{item.quantity}</td>
                                                                <td>₹{item.price}</td>
                                                                <td style={{ fontWeight: 700 }}>₹{item.total}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {order.discount > 0 && (
                                                <div style={{ fontSize: '13px', color: 'var(--success)', marginTop: '8px' }}>Discount: -₹{order.discount}</div>
                                            )}
                                            {order.address && (
                                                <div style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '8px' }}>
                                                    📍 {order.address.label}: {order.address.line1}, {order.address.city} - {order.address.pincode}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '4px' }}>
                                                💳 {order.paymentMethod} • {order.paymentStatus}
                                                {order.delivery && ` • 🚚 ${order.delivery.status} (${order.delivery.scheduledSlot})`}
                                            </div>

                                            {['PENDING', 'CONFIRMED'].includes(order.status) && (
                                                <button onClick={() => handleCancel(order.id)}
                                                    disabled={cancelling === order.id}
                                                    className="btn btn-sm" style={{ marginTop: '12px', background: 'var(--error)', color: '#fff', border: 'none' }}>
                                                    {cancelling === order.id ? 'Cancelling...' : '✕ Cancel Order'}
                                                </button>
                                            )}
                                            <OrderSupportButton
                                                orderId={order.id}
                                                orderNumber={order.orderNumber}
                                                items={order.items.map(i => `${i.variant.product?.name || i.variant.name} ${i.variant.size} ×${i.quantity}`).join(', ')}
                                                deliveryDate={order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : null}
                                                userId={user!.id}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>
                            No orders found. <Link href="/subscriptions" style={{ color: 'var(--navy-600)', fontWeight: 600 }}>Start a subscription</Link>
                        </div>
                    )}
                </main>
            </div>
            <Footer />
        </>
    )
}
