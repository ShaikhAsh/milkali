'use client'
import { useAuth, useAuthFetch } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

declare global {
    interface Window {
        Razorpay: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: () => void) => void }
    }
}

export default function WalletPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const authFetch = useAuthFetch()
    const [wallet, setWallet] = useState<{ balance: number; milkCreditMl?: number } | null>(null)
    const [transactions, setTxns] = useState<{ id: string; type: string; amount: number; description: string; createdAt: string }[]>([])
    const [rechargeAmount, setRechargeAmount] = useState('')
    const [msg, setMsg] = useState('')
    const [processing, setProcessing] = useState(false)

    // Auth redirect handled by dashboard/layout.tsx

    const fetchData = () => {
        authFetch('/api/wallet').then(d => { if (d.success) { setWallet(d.data); setTxns(d.data.transactions || []) } })
    }
    useEffect(() => { if (user) fetchData() }, [user]) // eslint-disable-line

    const handleRecharge = async () => {
        const amt = parseFloat(rechargeAmount)
        if (!amt || amt < 100) { setMsg('Minimum recharge: ₹100'); return }
        if (amt > 50000) { setMsg('Maximum recharge: ₹50,000'); return }

        setProcessing(true)
        setMsg('')

        try {
            // Step 1: Create Razorpay order via backend
            const res = await authFetch('/api/wallet', {
                method: 'POST',
                body: JSON.stringify({ action: 'create-order', amount: amt })
            })

            if (!res.success) {
                setMsg(res.error || 'Failed to create payment order')
                setProcessing(false)
                return
            }

            const { orderId, keyId, currency, name, description } = res.data

            // Step 2: Open Razorpay Checkout popup
            if (!window.Razorpay) {
                setMsg('Payment gateway is loading. Please try again in a moment.')
                setProcessing(false)
                return
            }

            const options = {
                key: keyId,
                amount: Math.round(amt * 100),
                currency: currency || 'INR',
                name: name || 'Milk Ali',
                description: description || `Wallet Recharge - ₹${amt}`,
                order_id: orderId,
                handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
                    // Step 3: Verify payment on backend
                    setMsg('Verifying payment...')
                    const verifyRes = await authFetch('/api/wallet', {
                        method: 'POST',
                        body: JSON.stringify({
                            action: 'verify-payment',
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            amount: amt,
                        })
                    })

                    if (verifyRes.success) {
                        setMsg(`✅ ₹${amt} added to your wallet!`)
                        setRechargeAmount('')
                        fetchData()
                    } else {
                        setMsg(verifyRes.error || 'Payment verification failed. Your money is safe — it will auto-credit in a few minutes via webhook.')
                    }
                    setProcessing(false)
                },
                prefill: {
                    email: user?.email || '',
                },
                theme: {
                    color: '#1a1a2e',
                },
                modal: {
                    ondismiss: () => {
                        setMsg('Payment cancelled. No money was deducted.')
                        setProcessing(false)
                    }
                }
            }

            const rzp = new window.Razorpay(options)
            rzp.open()

        } catch (err) {
            console.error('Recharge error:', err)
            setMsg('Something went wrong. Please try again.')
            setProcessing(false)
        }
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
                        <li><Link href="/dashboard/wallet" className="active">💰 Wallet</Link></li>
                        <li><Link href="/dashboard/loyalty">🏆 Loyalty</Link></li>
                        <li><Link href="/dashboard/addresses">📍 Addresses</Link></li>
                        <li><Link href="/dashboard/profile">👤 Profile</Link></li>
                        {user.role === 'USER' && <li><Link href="/dashboard/referrals">⭐ Referrals</Link></li>}
                    </ul>
                </aside>
                <main className="dashboard-content">
                    <div className="dashboard-header"><h1>My Wallet</h1><p>Manage your prepaid balance for deliveries</p></div>

                    <div className="stats-row" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="stat-card stat-card-navy" style={{ maxWidth: '360px' }}>
                            <div className="stat-label">Current Balance</div>
                            <div className="stat-value" style={{ fontSize: '40px' }}>₹{wallet?.balance?.toFixed(2) || '0.00'}</div>
                        </div>
                    </div>

                    {/* Milk Credit Card (B2C only) */}
                    {user.role === 'USER' && (wallet?.milkCreditMl ?? 0) >= 0 && (
                        <div className="card" style={{ padding: '20px', marginBottom: '24px', background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)', border: '1px solid #FDE68A' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold-700)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>🥛 Milk Credit (from Referrals)</div>
                                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--navy-800)' }}>{((wallet?.milkCreditMl ?? 0) / 1000).toFixed(1)}L</div>
                                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{wallet?.milkCreditMl ?? 0} ml</div>
                                </div>
                                <Link href="/dashboard/referrals" className="btn btn-sm btn-ghost" style={{ color: 'var(--gold-700)' }}>Earn More →</Link>
                            </div>
                        </div>
                    )}

                    <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
                        <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy-800)', marginBottom: '16px' }}>Recharge Wallet</h3>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            {[500, 1000, 2000, 5000].map(amt => (
                                <button key={amt} onClick={() => setRechargeAmount(amt.toString())} className={`btn btn-sm ${rechargeAmount === amt.toString() ? 'btn-primary' : 'btn-ghost'}`}>
                                    ₹{amt}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input className="form-input" type="number" placeholder="Enter amount (min ₹100)" value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)} style={{ maxWidth: '260px' }} />
                            <button onClick={handleRecharge} className="btn btn-primary" disabled={processing}>
                                {processing ? 'Processing...' : 'Recharge'}
                            </button>
                        </div>
                        {msg && <div className={`alert ${msg.includes('✅') ? 'alert-success' : msg.includes('cancelled') ? 'alert-warning' : 'alert-error'}`} style={{ marginTop: '12px' }}>{msg}</div>}
                    </div>

                    <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--navy-800)', marginBottom: '16px' }}>Transaction History</h3>
                    {transactions.length > 0 ? (
                        <div className="data-table">
                            <table>
                                <thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Amount</th></tr></thead>
                                <tbody>
                                    {transactions.map(t => (
                                        <tr key={t.id}>
                                            <td>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td>{t.description}</td>
                                            <td><span className={`status-badge ${t.type === 'CREDIT' ? 'status-active' : 'status-cancelled'}`}>{t.type}</span></td>
                                            <td style={{ fontWeight: 700, color: t.type === 'CREDIT' ? 'var(--success)' : 'var(--error)' }}>{t.type === 'CREDIT' ? '+' : '-'}₹{t.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)' }}>No transactions yet. Recharge your wallet to get started.</div>
                    )}
                </main>
            </div>
            <Footer />
        </>
    )
}
