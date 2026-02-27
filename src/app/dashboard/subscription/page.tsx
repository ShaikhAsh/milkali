'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import SubscriptionSupportButton from '@/components/support/SubscriptionSupportButton'

interface Variant {
    id: string
    name: string
    price: number
    unit: string
    product: { name: string }
}

interface Address {
    id: string
    line1: string
    line2?: string
    city: string
    pincode: string
    label?: string
}

interface Subscription {
    id: string
    status: string
    frequency: string
    quantity: number
    variant: { name: string; price: number }
    address: { line1: string; pincode: string }
    startDate: string
    schedules: { date: string; status: string }[]
}

export default function SubscriptionPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [subs, setSubs] = useState<Subscription[]>([])
    const [msg, setMsg] = useState('')

    // ─── New Subscription Form State ───
    const [variants, setVariants] = useState<Variant[]>([])
    const [addresses, setAddresses] = useState<Address[]>([])
    const [selectedVariantId, setSelectedVariantId] = useState('')
    const [selectedAddressId, setSelectedAddressId] = useState('')
    const [frequency, setFrequency] = useState<'DAILY' | 'ALTERNATE' | 'WEEKLY'>('DAILY')
    const [quantity, setQuantity] = useState(1)
    const [startDate, setStartDate] = useState('')
    const [creating, setCreating] = useState(false)
    const [walletBalance, setWalletBalance] = useState<number | null>(null)

    // Auth redirect handled by dashboard/layout.tsx
    useEffect(() => { if (user) { fetchSubs(); fetchFormData() } }, [user]) // eslint-disable-line

    const fetchSubs = () => authFetch('/api/subscriptions').then(d => d.success && setSubs(d.data || []))

    const fetchFormData = async () => {
        // Fetch products (to get variants)
        const prodRes = await authFetch('/api/products')
        if (prodRes.success) {
            const allVariants: Variant[] = []
            for (const product of prodRes.data || []) {
                for (const v of product.variants || []) {
                    allVariants.push({ ...v, product: { name: product.name } })
                }
            }
            setVariants(allVariants)
            if (allVariants.length > 0) setSelectedVariantId(allVariants[0].id)
        }

        // Fetch addresses
        const addrRes = await authFetch('/api/addresses')
        if (addrRes.success && addrRes.data) {
            setAddresses(addrRes.data)
            if (addrRes.data.length > 0) setSelectedAddressId(addrRes.data[0].id)
        }

        // Fetch wallet balance
        const walRes = await authFetch('/api/wallet')
        if (walRes.success) setWalletBalance(walRes.data?.balance || 0)

        // Default start date: tomorrow
        const tmr = new Date()
        tmr.setDate(tmr.getDate() + 1)
        setStartDate(tmr.toISOString().split('T')[0])
    }

    const doAction = async (id: string, action: string) => {
        const res = await authFetch('/api/subscriptions', { method: 'PATCH', body: JSON.stringify({ action, subscriptionId: id }) })
        setMsg(res.success ? `✅ Subscription ${action}d successfully!` : res.error)
        fetchSubs()
    }

    const handleSubscribe = async () => {
        if (!selectedVariantId) { setMsg('Please select a milk variant'); return }
        if (!selectedAddressId) { setMsg('Please select a delivery address'); return }
        if (!startDate) { setMsg('Please select a start date'); return }

        setCreating(true)
        setMsg('')

        const res = await authFetch('/api/subscriptions', {
            method: 'POST',
            body: JSON.stringify({
                variantId: selectedVariantId,
                addressId: selectedAddressId,
                frequency,
                quantity,
                startDate,
            })
        })

        if (res.success) {
            setMsg('✅ Subscription created! Your deliveries will start from ' + new Date(startDate).toLocaleDateString('en-IN'))
            fetchSubs()
        } else {
            setMsg(res.error || 'Failed to create subscription')
        }
        setCreating(false)
    }

    if (loading || !user) return <div className="loader"><div className="spinner" /></div>

    const activeSub = subs.find(s => s.status === 'ACTIVE' || s.status === 'PAUSED')

    // Calendar logic
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
    const scheduleMap: Record<number, string> = {}
    activeSub?.schedules?.forEach(s => {
        const d = new Date(s.date).getDate()
        scheduleMap[d] = s.status
    })

    // Calculate required balance for selected plan
    const selectedVariant = variants.find(v => v.id === selectedVariantId)
    const dailyCost = selectedVariant ? selectedVariant.price * quantity : 0
    const daysNeeded = frequency === 'DAILY' ? 7 : frequency === 'ALTERNATE' ? 4 : 1
    const requiredBalance = dailyCost * daysNeeded

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <aside className="dashboard-sidebar">
                    <div className="sidebar-user"><div className="name">{user.name || 'User'}</div><div className="email">{user.email}</div></div>
                    <ul className="sidebar-menu">
                        <li><Link href="/dashboard">📊 Dashboard</Link></li>
                        <li><Link href="/dashboard/subscription" className="active">📅 Subscription</Link></li>
                        <li><Link href="/dashboard/orders">📦 Orders</Link></li>
                        <li><Link href="/dashboard/wallet">💰 Wallet</Link></li>
                        <li><Link href="/dashboard/loyalty">🏆 Loyalty</Link></li>
                        <li><Link href="/dashboard/addresses">📍 Addresses</Link></li>
                        <li><Link href="/dashboard/profile">👤 Profile</Link></li>
                        {user.role === 'USER' && <li><Link href="/dashboard/referrals">⭐ Referrals</Link></li>}
                    </ul>
                </aside>
                <main className="dashboard-content">
                    <div className="dashboard-header"><h1>My Subscription</h1><p>Manage your daily milk delivery schedule</p></div>
                    {msg && <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '20px' }}>{msg}</div>}

                    {activeSub ? (
                        <>
                            {/* ─── ACTIVE SUBSCRIPTION VIEW ─── */}
                            <div className="stats-row">
                                <div className="stat-card">
                                    <div className="stat-label">Status</div>
                                    <span className={`status-badge status-${activeSub.status.toLowerCase()}`}>{activeSub.status}</span>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Frequency</div>
                                    <div className="stat-value" style={{ fontSize: '18px' }}>{activeSub.frequency}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Quantity</div>
                                    <div className="stat-value" style={{ fontSize: '18px' }}>{activeSub.quantity}× {activeSub.variant?.name}</div>
                                </div>
                                <div className="stat-card stat-card-navy">
                                    <div className="stat-label">Daily Cost</div>
                                    <div className="stat-value">₹{(activeSub.variant?.price * activeSub.quantity).toFixed(0)}</div>
                                </div>
                            </div>

                            {/* Delivery Calendar */}
                            <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
                                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy-800)', marginBottom: '16px' }}>
                                    Delivery Calendar — {now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                                </h3>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '12px', color: 'var(--gray-500)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--navy-100)' }} /> Scheduled</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--success-bg)' }} /> Delivered</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--warning-bg)' }} /> Skipped</span>
                                </div>
                                <div className="calendar-grid">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="calendar-header-cell">{d}</div>
                                    ))}
                                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="calendar-day empty" />)}
                                    {Array.from({ length: daysInMonth }).map((_, i) => {
                                        const day = i + 1
                                        const status = scheduleMap[day]
                                        const isToday = day === now.getDate()
                                        let cls = 'calendar-day'
                                        if (isToday) cls += ' today'
                                        if (status === 'SCHEDULED') cls += ' scheduled'
                                        else if (status === 'DELIVERED') cls += ' delivered'
                                        else if (status === 'SKIPPED') cls += ' skipped'
                                        return <div key={day} className={cls}>{day}</div>
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {activeSub.status === 'ACTIVE' && (
                                    <button onClick={() => doAction(activeSub.id, 'pause')} className="btn btn-ghost">⏸️ Pause Subscription</button>
                                )}
                                {activeSub.status === 'PAUSED' && (
                                    <button onClick={() => doAction(activeSub.id, 'resume')} className="btn btn-primary">▶️ Resume Subscription</button>
                                )}
                                <button onClick={() => doAction(activeSub.id, 'cancel')} className="btn btn-ghost" style={{ color: 'var(--error)', borderColor: '#FECACA' }}>Cancel Subscription</button>
                                <SubscriptionSupportButton
                                    subscriptionId={activeSub.id}
                                    variantName={activeSub.variant?.name || 'Subscription'}
                                    frequency={activeSub.frequency}
                                    nextDelivery={activeSub.schedules?.[0]?.date ? new Date(activeSub.schedules[0].date).toLocaleDateString('en-IN') : null}
                                    userId={user!.id}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* ─── NEW SUBSCRIPTION FORM ─── */}
                            <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '24px' }}>
                                    🥛 Start Your Subscription
                                </h3>

                                {/* Step 1: Choose Variant */}
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        1. Choose Your Milk
                                    </label>
                                    {variants.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                            {variants.map(v => (
                                                <div
                                                    key={v.id}
                                                    onClick={() => setSelectedVariantId(v.id)}
                                                    style={{
                                                        padding: '16px',
                                                        borderRadius: '12px',
                                                        border: selectedVariantId === v.id ? '2px solid var(--navy-700)' : '2px solid var(--gray-200)',
                                                        background: selectedVariantId === v.id ? 'var(--navy-50, #f0f4f8)' : '#fff',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 700, color: 'var(--navy-800)', fontSize: '15px' }}>{v.product.name}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '8px' }}>{v.name} — {v.unit}</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy-700)' }}>₹{v.price}<span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--gray-400)' }}>/day</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '16px', color: 'var(--gray-400)', textAlign: 'center' }}>Loading products...</div>
                                    )}
                                </div>

                                {/* Step 2: Frequency */}
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        2. Delivery Frequency
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {([
                                            { value: 'DAILY', label: 'Every Day', desc: '30 deliveries/month' },
                                            { value: 'ALTERNATE', label: 'Alternate Days', desc: '15 deliveries/month' },
                                            { value: 'WEEKLY', label: 'Once a Week', desc: '4 deliveries/month' },
                                        ] as const).map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setFrequency(opt.value)}
                                                className={`btn ${frequency === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                                                style={{ flexDirection: 'column', padding: '12px 20px', height: 'auto' }}
                                            >
                                                <span style={{ fontWeight: 700 }}>{opt.label}</span>
                                                <span style={{ fontSize: '11px', opacity: 0.7 }}>{opt.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Step 3: Quantity */}
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        3. Quantity (packs per delivery)
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="btn btn-ghost btn-sm" style={{ width: '36px', height: '36px', padding: 0 }}>−</button>
                                        <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--navy-800)', minWidth: '40px', textAlign: 'center' }}>{quantity}</span>
                                        <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="btn btn-ghost btn-sm" style={{ width: '36px', height: '36px', padding: 0 }}>+</button>
                                    </div>
                                </div>

                                {/* Step 4: Address */}
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        4. Delivery Address
                                    </label>
                                    {addresses.length > 0 ? (
                                        <div style={{ display: 'grid', gap: '8px' }}>
                                            {addresses.map(addr => (
                                                <div
                                                    key={addr.id}
                                                    onClick={() => setSelectedAddressId(addr.id)}
                                                    style={{
                                                        padding: '14px 16px',
                                                        borderRadius: '10px',
                                                        border: selectedAddressId === addr.id ? '2px solid var(--navy-700)' : '2px solid var(--gray-200)',
                                                        background: selectedAddressId === addr.id ? 'var(--navy-50, #f0f4f8)' : '#fff',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)' }}>
                                                        {addr.label || 'Home'} — {addr.pincode}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '16px', textAlign: 'center' }}>
                                            <p style={{ color: 'var(--gray-400)', marginBottom: '12px' }}>No addresses found. Add one first.</p>
                                            <Link href="/dashboard/addresses" className="btn btn-ghost btn-sm">Add Address →</Link>
                                        </div>
                                    )}
                                </div>

                                {/* Step 5: Start Date */}
                                <div style={{ marginBottom: '28px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        5. Start Date
                                    </label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })()}
                                        style={{ maxWidth: '240px' }}
                                    />
                                </div>

                                {/* Summary + Submit */}
                                <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--cream-50, #fefcf3)', border: '1px solid var(--cream-200, #f5e6c8)', marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy-800)', marginBottom: '12px' }}>Order Summary</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                                        <span style={{ color: 'var(--gray-500)' }}>Per delivery:</span>
                                        <span style={{ fontWeight: 700 }}>₹{dailyCost.toFixed(0)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                                        <span style={{ color: 'var(--gray-500)' }}>Min. wallet balance needed:</span>
                                        <span style={{ fontWeight: 700 }}>₹{requiredBalance.toFixed(0)} ({daysNeeded} deliveries)</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px solid var(--gray-200)', paddingTop: '8px', marginTop: '8px' }}>
                                        <span style={{ color: 'var(--gray-500)' }}>Your wallet:</span>
                                        <span style={{ fontWeight: 700, color: (walletBalance ?? 0) >= requiredBalance ? 'var(--success)' : 'var(--error)' }}>
                                            ₹{walletBalance?.toFixed(0) || '0'}
                                            {(walletBalance ?? 0) < requiredBalance && ' (insufficient)'}
                                        </span>
                                    </div>
                                </div>

                                {(walletBalance ?? 0) < requiredBalance && (
                                    <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
                                        You need ₹{(requiredBalance - (walletBalance ?? 0)).toFixed(0)} more in your wallet.{' '}
                                        <Link href="/dashboard/wallet" style={{ fontWeight: 700, color: 'var(--navy-700)', textDecoration: 'underline' }}>Recharge now →</Link>
                                    </div>
                                )}

                                <button
                                    onClick={handleSubscribe}
                                    disabled={creating || !selectedVariantId || !selectedAddressId || addresses.length === 0}
                                    className="btn btn-primary btn-lg"
                                    style={{ width: '100%' }}
                                >
                                    {creating ? 'Creating Subscription...' : `Subscribe — ₹${dailyCost.toFixed(0)}/delivery`}
                                </button>
                            </div>
                        </>
                    )}
                </main>
            </div>
            <Footer />
        </>
    )
}
