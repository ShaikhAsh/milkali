'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { openWhatsApp, addressSupportMessage } from '@/lib/whatsapp'

interface Address {
    id: string; label: string; fullName: string; phone: string
    line1: string; line2?: string; pincode: string; isDefault: boolean
}

interface BlockedSub { id: string; status: string; variantName: string }

const EMPTY_FORM = { label: 'Home', fullName: '', phone: '', line1: '', line2: '', pincode: '', isDefault: false }

export default function AddressesPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()

    const [addresses, setAddresses] = useState<Address[]>([])
    const [fetching, setFetching] = useState(true)

    // Form state (shared for add + edit)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null) // null = adding new
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<Address | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState('')
    const [blockedSubs, setBlockedSubs] = useState<BlockedSub[]>([])

    // Per-card loading (for set-default)
    const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

    // Auth redirect handled by dashboard/layout.tsx

    const fetchAddresses = useCallback(async () => {
        setFetching(true)
        const d = await authFetch('/api/addresses')
        if (d.success) setAddresses(d.data || [])
        setFetching(false)
    }, [authFetch])

    useEffect(() => { if (user) fetchAddresses() }, [user]) // eslint-disable-line

    // ─── ADD / EDIT ───
    const openAddForm = () => {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setShowForm(true)
        setMsg('')
    }

    const openEditForm = (addr: Address) => {
        setEditingId(addr.id)
        setForm({
            label: addr.label, fullName: addr.fullName, phone: addr.phone,
            line1: addr.line1, line2: addr.line2 || '', pincode: addr.pincode,
            isDefault: addr.isDefault,
        })
        setShowForm(true)
        setMsg('')
    }

    const closeForm = () => {
        setShowForm(false)
        setEditingId(null)
        setForm(EMPTY_FORM)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMsg('')

        let res
        if (editingId) {
            // PATCH existing
            res = await authFetch('/api/addresses', {
                method: 'PATCH',
                body: JSON.stringify({ addressId: editingId, ...form })
            })
        } else {
            // POST new
            res = await authFetch('/api/addresses', {
                method: 'POST',
                body: JSON.stringify(form)
            })
        }

        if (res.success) {
            setMsg(editingId ? '✅ Address updated!' : '✅ Address added!')
            closeForm()
            fetchAddresses()
        } else {
            setMsg(res.error || 'Failed to save address')
        }
        setSaving(false)
    }

    // ─── SET DEFAULT ───
    const setDefault = async (id: string) => {
        setSettingDefaultId(id)
        // Optimistic update
        setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))

        const res = await authFetch('/api/addresses', {
            method: 'PATCH',
            body: JSON.stringify({ addressId: id, isDefault: true })
        })

        if (!res.success) {
            setMsg(res.error || 'Failed to set default')
            fetchAddresses() // revert optimistic
        }
        setSettingDefaultId(null)
    }

    // ─── DELETE ───
    const confirmDelete = (addr: Address) => {
        setDeleteTarget(addr)
        setDeleteError('')
        setBlockedSubs([])
    }

    const executeDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        setDeleteError('')
        setBlockedSubs([])

        const res = await authFetch(`/api/addresses?id=${deleteTarget.id}`, { method: 'DELETE' })

        if (res.success && res.data?.code === 'ADDRESS_IN_USE') {
            // Structured blocker — show subscription details
            setBlockedSubs(res.data.subscriptions || [])
            setDeleteError(res.data.message)
            setDeleting(false)
            return
        }

        if (res.success) {
            setDeleteTarget(null)
            setMsg('✅ Address deleted')
            fetchAddresses()
        } else {
            setDeleteError(res.error || 'Failed to delete address')
        }
        setDeleting(false)
    }

    if (loading || !user) return <div className="loader"><div className="spinner" /></div>

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <aside className="dashboard-sidebar">
                    <div className="sidebar-user"><div className="name">{user.name || 'User'}</div><div className="email">{user.email}</div></div>
                    <ul className="sidebar-menu">
                        <li><Link href="/dashboard">📊 Dashboard</Link></li>
                        <li><Link href="/dashboard/subscription">📅 Subscription</Link></li>
                        <li><Link href="/dashboard/orders">📦 Orders</Link></li>
                        <li><Link href="/dashboard/wallet">💰 Wallet</Link></li>
                        <li><Link href="/dashboard/loyalty">🏆 Loyalty</Link></li>
                        <li><Link href="/dashboard/addresses" className="active">📍 Addresses</Link></li>
                        <li><Link href="/dashboard/profile">👤 Profile</Link></li>
                        {user.role === 'USER' && <li><Link href="/dashboard/referrals">⭐ Referrals</Link></li>}
                    </ul>
                </aside>
                <main className="dashboard-content">
                    <div className="dashboard-header">
                        <h1>My Addresses</h1>
                        <p>Manage your delivery addresses — Mumbai PIN codes only</p>
                    </div>

                    {msg && (
                        <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '16px' }}>
                            {msg}
                            <button onClick={() => setMsg('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '16px', lineHeight: 1 }}>×</button>
                        </div>
                    )}

                    {/* Add / Cancel button */}
                    {!showForm && addresses.length < 10 && (
                        <button onClick={openAddForm} className="btn btn-primary" style={{ marginBottom: '24px' }}>
                            + Add New Address
                        </button>
                    )}

                    {/* ─── ADD / EDIT FORM ─── */}
                    {showForm && (
                        <form onSubmit={handleSubmit} className="card" style={{ padding: '28px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy-800)', margin: 0 }}>
                                    {editingId ? '✏️ Edit Address' : '📍 New Address'}
                                </h3>
                                <button type="button" onClick={closeForm} className="btn btn-ghost btn-sm">✕ Cancel</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Label</label>
                                    <select className="form-input" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}>
                                        <option>Home</option><option>Office</option><option>Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input className="form-input" required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Recipient name" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone *</label>
                                <input className="form-input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile number" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address Line 1 *</label>
                                <input className="form-input" required value={form.line1} onChange={e => setForm({ ...form, line1: e.target.value })} placeholder="Flat, building, street" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address Line 2</label>
                                <input className="form-input" value={form.line2} onChange={e => setForm({ ...form, line2: e.target.value })} placeholder="Landmark, area (optional)" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
                                <div className="form-group">
                                    <label className="form-label">PIN Code (Mumbai) *</label>
                                    <input className="form-input" required maxLength={6} pattern="[0-9]{6}" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} placeholder="400001" />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '14px', color: 'var(--gray-600)', marginBottom: '14px' }}>
                                        <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} /> Set as default address
                                    </label>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
                            </button>
                        </form>
                    )}

                    {/* ─── ADDRESS CARDS ─── */}
                    {fetching && addresses.length === 0 ? (
                        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto 16px' }} />
                            <p style={{ color: 'var(--gray-400)' }}>Loading addresses...</p>
                        </div>
                    ) : addresses.length === 0 && !showForm ? (
                        <div className="card" style={{ padding: '64px', textAlign: 'center' }}>
                            <div style={{ fontSize: '56px', marginBottom: '16px' }}>📍</div>
                            <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--navy-800)' }}>No Saved Addresses</h3>
                            <p style={{ color: 'var(--gray-400)', marginBottom: '24px' }}>Add your first delivery address to start receiving fresh milk</p>
                            <button onClick={openAddForm} className="btn btn-primary btn-lg">+ Add Your First Address</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {addresses.map(a => (
                                <div key={a.id} className="card" style={{ padding: '24px', position: 'relative', border: a.isDefault ? '2px solid var(--navy-700)' : undefined }}>
                                    {/* Badge row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <span className="badge">{a.label}</span>
                                            {a.isDefault && <span className="status-badge status-active" style={{ fontSize: '11px' }}>★ Default</span>}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div style={{ fontWeight: 600, color: 'var(--navy-800)', marginBottom: '6px' }}>{a.fullName}</div>
                                    <div style={{ fontSize: '14px', color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: '4px' }}>
                                        {a.line1}
                                        {a.line2 && <><br />{a.line2}</>}
                                        <br />Mumbai — {a.pincode}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--gray-400)', marginBottom: '16px' }}>📞 {a.phone}</div>

                                    {/* Action buttons */}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--gray-100)', paddingTop: '12px' }}>
                                        <button onClick={() => openEditForm(a)} className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }}>
                                            ✏️ Edit
                                        </button>
                                        {!a.isDefault && (
                                            <button
                                                onClick={() => setDefault(a.id)}
                                                disabled={settingDefaultId === a.id}
                                                className="btn btn-ghost btn-sm"
                                                style={{ fontSize: '12px' }}
                                            >
                                                {settingDefaultId === a.id ? '…' : '★ Set Default'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => confirmDelete(a)}
                                            className="btn btn-ghost btn-sm"
                                            style={{ fontSize: '12px', color: 'var(--error)', marginLeft: 'auto' }}
                                        >
                                            🗑 Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Address count */}
                    {addresses.length > 0 && (
                        <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '16px', textAlign: 'right' }}>
                            {addresses.length}/10 addresses used
                        </p>
                    )}
                </main>
            </div>

            {/* ─── DELETE CONFIRMATION MODAL ─── */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
                    onClick={(e) => { if (e.target === e.currentTarget && !deleting) { setDeleteTarget(null) } }}>
                    <div className="card" style={{ padding: '32px', maxWidth: '440px', width: '100%' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '12px' }}>
                            Delete Address?
                        </h3>
                        <div style={{ fontSize: '14px', color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: '8px' }}>
                            <strong>{deleteTarget.label}</strong> — {deleteTarget.fullName}<br />
                            {deleteTarget.line1}, {deleteTarget.pincode}
                        </div>

                        {deleteTarget.isDefault && !deleteError && (
                            <div className="alert alert-warning" style={{ marginBottom: '16px', fontSize: '13px' }}>
                                This is your default address. The next address will be automatically promoted.
                            </div>
                        )}

                        {/* Structured error: address in use */}
                        {deleteError && (
                            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: 600, marginBottom: '8px' }}>{deleteError}</div>
                                {blockedSubs.length > 0 && (
                                    <div>
                                        {blockedSubs.map(s => (
                                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                                                <span style={{ fontSize: '13px' }}>
                                                    {s.variantName} — <span className={`status-badge status-${s.status.toLowerCase()}`}>{s.status}</span>
                                                </span>
                                                <Link href="/dashboard/subscription" className="btn btn-ghost btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }}>
                                                    Go to Subscription →
                                                </Link>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => openWhatsApp(addressSupportMessage(deleteTarget!.id, deleteError, user!.id))}
                                            style={{ marginTop: '12px', background: 'none', border: 'none', color: '#25D366', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                            Contact support on WhatsApp
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost" disabled={deleting}>
                                Cancel
                            </button>
                            {!blockedSubs.length && (
                                <button onClick={executeDelete} className="btn btn-primary" disabled={deleting}
                                    style={{ background: 'var(--error)', borderColor: 'var(--error)' }}>
                                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    )
}
