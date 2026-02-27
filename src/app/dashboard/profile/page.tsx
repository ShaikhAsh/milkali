'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function ProfilePage() {
    const { user, loading, logout } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [msg, setMsg] = useState('')

    // Auth redirect handled by dashboard/layout.tsx
    useEffect(() => {
        if (user) {
            authFetch('/api/user').then(d => { if (d.success) { setName(d.data.name || ''); setPhone(d.data.phone || '') } })
        }
    }, [user, authFetch])

    const handleSave = async () => {
        const res = await authFetch('/api/user', { method: 'PATCH', body: JSON.stringify({ name, phone }) })
        setMsg(res.success ? '✅ Profile updated successfully!' : res.error)
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
                        <li><Link href="/dashboard/addresses">📍 Addresses</Link></li>
                        <li><Link href="/dashboard/profile" className="active">👤 Profile</Link></li>
                        {user.role === 'USER' && <li><Link href="/dashboard/referrals">⭐ Referrals</Link></li>}
                    </ul>
                </aside>
                <main className="dashboard-content">
                    <div className="dashboard-header"><h1>My Profile</h1><p>View and update your account details</p></div>
                    {msg && <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

                    <div className="card" style={{ padding: '32px', maxWidth: '480px' }}>
                        <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy-800)', marginBottom: '20px' }}>Account Details</h3>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" value={user.email} disabled style={{ background: 'var(--gray-50)', color: 'var(--gray-500)' }} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <input className="form-input" value={user.role} disabled style={{ background: 'var(--gray-50)', color: 'var(--gray-500)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button onClick={handleSave} className="btn btn-primary">Save Changes</button>
                            <button onClick={logout} className="btn btn-ghost" style={{ color: 'var(--error)', borderColor: '#FECACA' }}>Logout</button>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </>
    )
}
