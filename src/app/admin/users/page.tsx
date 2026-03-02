'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AdminSidebar from '@/components/AdminSidebar'
import Link from 'next/link'

interface UserRow {
    id: string
    name: string | null
    email: string
    phone: string | null
    role: string
    isActive: boolean
    isVerified: boolean
    createdAt: string
    wallet?: { balance: number } | null
    _count?: { orders: number; subscriptions: number }
}

export default function AdminUsersPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [users, setUsers] = useState<UserRow[]>([])
    const [roleFilter, setRoleFilter] = useState('')
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        if (!loading && !user) router.push('/auth/login')
        if (!loading && user && user.role !== 'ADMIN') router.push('/dashboard')
    }, [user, loading, router])

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') return
        const url = roleFilter ? `/api/admin?section=users&role=${roleFilter}` : '/api/admin?section=users'
        authFetch(url).then(d => d.success && setUsers(d.data || []))
    }, [user, roleFilter, authFetch])

    const handleRoleChange = async (userId: string, role: string) => {
        if (!confirm(`Change this user's role to ${role}?`)) return
        setUpdating(userId)
        await authFetch('/api/admin', { method: 'POST', body: JSON.stringify({ action: 'update-user-role', userId, role }) })
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
        setUpdating(null)
    }

    if (loading || !user || user.role !== 'ADMIN') return <div className="loader"><div className="spinner" /></div>

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <AdminSidebar userEmail={user.email} />
                <main className="dashboard-content">
                    <div className="dashboard-header"><h1>User Management</h1><p>View and manage platform users</p></div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        {['', 'B2C', 'B2B', 'ADMIN'].map(r => (
                            <button key={r} onClick={() => setRoleFilter(r)} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-ghost'}`}>
                                {r || 'All'}
                            </button>
                        ))}
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <div className="data-table">
                            <table>
                                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Wallet</th><th>Orders</th><th>Joined</th><th>Action</th></tr></thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 600 }}>{u.name || '—'}</td>
                                            <td style={{ fontSize: '13px' }}>{u.email}</td>
                                            <td style={{ fontSize: '13px' }}>{u.phone || '—'}</td>
                                            <td><span className={`status-badge ${u.role === 'ADMIN' ? 'status-active' : ''}`}>{u.role}</span></td>
                                            <td>₹{u.wallet?.balance ? Number(u.wallet.balance).toFixed(2) : '0.00'}</td>
                                            <td>{u._count?.orders || 0}</td>
                                            <td style={{ fontSize: '13px' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td>
                                                <select disabled={updating === u.id} value="" onChange={e => e.target.value && handleRoleChange(u.id, e.target.value)}
                                                    className="form-input" style={{ fontSize: '12px', padding: '4px 8px', minWidth: '100px' }}>
                                                    <option value="">Role…</option>
                                                    {u.role !== 'B2C' && <option value="B2C">B2C</option>}
                                                    {u.role !== 'B2B' && <option value="B2B">B2B</option>}
                                                    {u.role !== 'ADMIN' && <option value="ADMIN">ADMIN</option>}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {users.length === 0 && <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>No users found.</div>}
                </main>
            </div>
            <Footer />
        </>
    )
}
