'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

interface Coupon {
    id: string
    code: string
    description: string | null
    type: string
    value: number
    minOrder: number
    maxDiscount: number | null
    usageLimit: number | null
    usedCount: number
    isActive: boolean
    validFrom: string
    validUntil: string
}

export default function AdminCouponsPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ code: '', description: '', type: 'PERCENTAGE', value: '', minOrder: '0', maxDiscount: '', usageLimit: '', validFrom: '', validUntil: '' })
    const [msg, setMsg] = useState('')

    useEffect(() => {
        if (!loading && !user) router.push('/auth/login')
        if (!loading && user && user.role !== 'ADMIN') router.push('/dashboard')
    }, [user, loading, router])

    const fetchCoupons = () => {
        if (!user || user.role !== 'ADMIN') return
        authFetch('/api/admin?section=coupons').then(d => d.success && setCoupons(d.data || []))
    }
    useEffect(() => { fetchCoupons() }, [user]) // eslint-disable-line

    const handleCreate = async () => {
        setMsg('')
        if (!form.code || !form.value || !form.validFrom || !form.validUntil) { setMsg('Fill required fields'); return }
        const res = await authFetch('/api/admin', {
            method: 'POST',
            body: JSON.stringify({
                action: 'create-coupon',
                code: form.code,
                description: form.description,
                type: form.type,
                value: parseFloat(form.value),
                minOrder: parseFloat(form.minOrder) || 0,
                maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
                usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
                validFrom: form.validFrom,
                validUntil: form.validUntil,
            })
        })
        if (res.success) { setShowForm(false); setForm({ code: '', description: '', type: 'PERCENTAGE', value: '', minOrder: '0', maxDiscount: '', usageLimit: '', validFrom: '', validUntil: '' }); fetchCoupons() }
        else setMsg(res.error || 'Failed')
    }

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
                        <li><Link href="/admin/subscriptions">📅 Subscriptions</Link></li>
                        <li><Link href="/admin/deliveries">🚚 Deliveries</Link></li>
                        <li><Link href="/admin/coupons" className="active">🏷️ Coupons</Link></li>
                        <li><Link href="/admin/audit">📋 Audit Logs</Link></li>
                        <li><Link href="/dashboard" style={{ opacity: 0.6 }}>← Back to User</Link></li>
                    </ul>
                </aside>
                <main className="dashboard-content">
                    <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><h1>Coupons</h1><p>Create and manage discount coupons</p></div>
                        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm">{showForm ? '✕ Cancel' : '+ New Coupon'}</button>
                    </div>

                    {showForm && (
                        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                <input className="form-input" placeholder="Code (e.g. MILK20)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                                <input className="form-input" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                <select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="PERCENTAGE">Percentage</option><option value="FLAT">Flat</option>
                                </select>
                                <input className="form-input" type="number" placeholder="Value" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
                                <input className="form-input" type="number" placeholder="Min Order ₹" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} />
                                <input className="form-input" type="number" placeholder="Max Discount ₹ (opt)" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} />
                                <input className="form-input" type="number" placeholder="Usage Limit (opt)" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} />
                                <input className="form-input" type="date" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} />
                                <input className="form-input" type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} />
                            </div>
                            {msg && <div className="alert alert-error" style={{ marginTop: '12px' }}>{msg}</div>}
                            <button onClick={handleCreate} className="btn btn-primary" style={{ marginTop: '16px' }}>Create Coupon</button>
                        </div>
                    )}

                    {coupons.length > 0 ? (
                        <div className="data-table">
                            <table>
                                <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used</th><th>Valid Until</th><th>Active</th></tr></thead>
                                <tbody>
                                    {coupons.map(c => (
                                        <tr key={c.id}>
                                            <td style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{c.code}</td>
                                            <td>{c.type}</td>
                                            <td>{c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}</td>
                                            <td>₹{c.minOrder}</td>
                                            <td>{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                                            <td style={{ fontSize: '13px' }}>{new Date(c.validUntil).toLocaleDateString('en-IN')}</td>
                                            <td><span className={`status-badge ${c.isActive ? 'status-active' : 'status-cancelled'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>No coupons created yet.</div>
                    )}
                </main>
            </div>
            <Footer />
        </>
    )
}
