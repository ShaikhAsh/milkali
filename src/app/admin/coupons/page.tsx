'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AdminSidebar from '@/components/AdminSidebar'
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

const emptyForm = { code: '', description: '', type: 'PERCENTAGE', value: '', minOrder: '0', maxDiscount: '', usageLimit: '', validFrom: '', validUntil: '' }

export default function AdminCouponsPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
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

    const handleSave = async () => {
        setMsg('')
        if (!form.code || !form.value || !form.validFrom || !form.validUntil) { setMsg('Fill required fields'); return }
        const payload = {
            action: editingId ? 'update-coupon' : 'create-coupon',
            ...(editingId ? { couponId: editingId } : {}),
            code: form.code,
            description: form.description,
            type: form.type,
            value: parseFloat(form.value),
            minOrder: parseFloat(form.minOrder) || 0,
            maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
            usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
            validFrom: form.validFrom,
            validUntil: form.validUntil,
        }
        const res = await authFetch('/api/admin', { method: 'POST', body: JSON.stringify(payload) })
        if (res.success) { closeForm(); fetchCoupons() }
        else setMsg(res.error || 'Failed')
    }

    const handleEdit = (c: Coupon) => {
        setEditingId(c.id)
        setForm({
            code: c.code,
            description: c.description || '',
            type: c.type,
            value: String(c.value),
            minOrder: String(c.minOrder),
            maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '',
            usageLimit: c.usageLimit ? String(c.usageLimit) : '',
            validFrom: c.validFrom.split('T')[0],
            validUntil: c.validUntil.split('T')[0],
        })
        setShowForm(true)
        setMsg('')
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon? This cannot be undone.')) return
        const res = await authFetch('/api/admin', { method: 'POST', body: JSON.stringify({ action: 'delete-coupon', couponId: id }) })
        if (res.success) fetchCoupons()
        else setMsg(res.error || 'Delete failed')
    }

    const handleToggleActive = async (c: Coupon) => {
        const res = await authFetch('/api/admin', { method: 'POST', body: JSON.stringify({ action: 'update-coupon', couponId: c.id, isActive: !c.isActive }) })
        if (res.success) fetchCoupons()
    }

    const closeForm = () => {
        setShowForm(false)
        setEditingId(null)
        setForm(emptyForm)
        setMsg('')
    }

    if (loading || !user || user.role !== 'ADMIN') return <div className="loader"><div className="spinner" /></div>

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <AdminSidebar userEmail={user.email} />
                <main className="dashboard-content">
                    <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><h1>Coupons</h1><p>Create and manage discount coupons</p></div>
                        <button onClick={() => showForm ? closeForm() : setShowForm(true)} className="btn btn-primary btn-sm">
                            {showForm ? '✕ Cancel' : '+ New Coupon'}
                        </button>
                    </div>

                    {showForm && (
                        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--navy-800)' }}>
                                {editingId ? '✏️ Edit Coupon' : '➕ New Coupon'}
                            </h3>
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
                            <button onClick={handleSave} className="btn btn-primary" style={{ marginTop: '16px' }}>
                                {editingId ? 'Update Coupon' : 'Create Coupon'}
                            </button>
                        </div>
                    )}

                    {coupons.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <div className="data-table">
                                <table>
                                    <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used</th><th>Valid Until</th><th>Active</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {coupons.map(c => (
                                            <tr key={c.id}>
                                                <td style={{ fontWeight: 700, letterSpacing: '0.5px' }}>{c.code}</td>
                                                <td>{c.type}</td>
                                                <td>{c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}</td>
                                                <td>₹{c.minOrder}</td>
                                                <td>{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                                                <td style={{ fontSize: '13px' }}>{new Date(c.validUntil).toLocaleDateString('en-IN')}</td>
                                                <td>
                                                    <button onClick={() => handleToggleActive(c)} className={`status-badge ${c.isActive ? 'status-active' : 'status-cancelled'}`}
                                                        style={{ cursor: 'pointer', border: 'none', background: 'inherit' }} title="Click to toggle">
                                                        {c.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button onClick={() => handleEdit(c)} className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }}>✏️ Edit</button>
                                                        <button onClick={() => handleDelete(c.id)} className="btn btn-ghost btn-sm" style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--error)', borderColor: '#FECACA' }}>🗑️ Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
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
