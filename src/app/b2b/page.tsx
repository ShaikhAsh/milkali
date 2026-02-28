'use client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useState } from 'react'
import Link from 'next/link'

export default function B2BPage() {
    const [form, setForm] = useState({ businessName: '', contactPerson: '', email: '', phone: '', businessType: '', expectedDailyQty: '', message: '' })
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, type: 'B2B' }),
            })
            const data = await res.json()
            if (data.success) {
                setSubmitted(true)
            } else {
                setError(data.error || 'Something went wrong. Please try again.')
            }
        } catch {
            setError('Network error. Please try again.')
        }
    }

    const benefits = [
        { icon: '💰', title: 'Competitive Pricing', desc: 'Volume-based bulk pricing tiers with significant cost savings' },
        { icon: '🕐', title: 'Reliable Supply', desc: 'Guaranteed daily delivery between 5-7 AM, 365 days a year' },
        { icon: '📊', title: 'Business Dashboard', desc: 'Dedicated B2B dashboard to track orders, invoices, and usage' },
        { icon: '💳', title: 'Credit Facility', desc: 'Approved businesses can avail credit terms for seamless operations' },
        { icon: '👤', title: 'Account Manager', desc: 'Dedicated account manager for priority support and smooth operations' },
    ]



    return (
        <>
            <Header />
            <div className="page-banner">
                <h1>Business Partnership</h1>
                <p>Premium bulk milk supply for hotels, cafes, restaurants, and retailers</p>
            </div>

            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">B2B Benefits</div>
                        <h2>Why Partner With Milkali?</h2>
                        <p>We supply premium cow milk in bulk to businesses across Mumbai</p>
                    </div>
                    <div className="b2b-grid">
                        {benefits.map((b, i) => (
                            <div key={i} className="b2b-card">
                                <div className="b2b-icon">{b.icon}</div>
                                <h3>{b.title}</h3>
                                <p>{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section section-cream">
                <div className="container">
                    <div className="card" style={{
                        background: 'linear-gradient(135deg, #002E5B 0%, #001A33 100%)',
                        color: 'white',
                        padding: '48px',
                        borderRadius: '24px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '40px',
                        alignItems: 'center',
                        boxShadow: '0 20px 40px rgba(0, 46, 91, 0.15)'
                    }}>
                        <div>
                            <h2 style={{ color: 'white', marginBottom: '16px', fontSize: '36px' }}>Custom Business Pricing</h2>
                            <p style={{ color: '#E0E7FF', fontSize: '18px', marginBottom: '32px', lineHeight: '1.6' }}>
                                Flexible bulk pricing based on daily volume, delivery schedule, and long-term contract.
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    'Dedicated account manager',
                                    'Priority early-morning delivery',
                                    'Volume-based discounts',
                                    'Flexible billing cycles'
                                ].map((bullet, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', color: '#FFF' }}>
                                        <div style={{ background: '#B58E3E', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 700 }}>
                                            ✓
                                        </div>
                                        {bullet}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
                            <h3 style={{ color: '#002E5B', marginBottom: '24px', fontSize: '24px' }}>Get Your Custom Quote</h3>
                            <Link href="/b2b" className="btn btn-primary btn-block btn-lg" style={{
                                background: '#B58E3E',
                                color: 'white',
                                border: 'none',
                                marginBottom: '16px',
                                fontSize: '16px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Contact Sales for Pricing
                            </Link>
                            <Link href="/b2b" style={{
                                color: '#002E5B',
                                fontWeight: 600,
                                fontSize: '15px',
                                textDecoration: 'underline'
                            }}>
                                Request a Custom Quote
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">Get Started</div>
                        <h2>Business Inquiry</h2>
                        <p>Fill out the form below and our B2B team will reach out within 24 hours</p>
                    </div>
                    {submitted ? (
                        <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '48px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                            <h3 style={{ marginBottom: '8px' }}>Inquiry Submitted!</h3>
                            <p style={{ color: 'var(--gray-500)' }}>Our B2B team will contact you within 24 hours.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <div className="card" style={{ padding: '32px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group"><label className="form-label">Business Name *</label><input className="form-input" required value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Contact Person *</label><input className="form-input" required value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Business Type</label>
                                        <select className="form-input" value={form.businessType} onChange={e => setForm({ ...form, businessType: e.target.value })}>
                                            <option value="">Select Type</option>
                                            <option>Hotel</option>
                                            <option>Cafe</option>
                                            <option>Restaurant</option>
                                            <option>Retailer</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label className="form-label">Expected Daily Qty (L)</label><input className="form-input" type="number" value={form.expectedDailyQty} onChange={e => setForm({ ...form, expectedDailyQty: e.target.value })} /></div>
                                </div>
                                <div className="form-group"><label className="form-label">Message</label><textarea className="form-input" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your requirements..." /></div>
                                <button type="submit" className="btn btn-primary btn-block btn-lg">Submit Inquiry</button>
                                {error && <div className="alert alert-error" style={{ marginTop: '12px' }}>{error}</div>}
                            </div>
                        </form>
                    )}
                </div>
            </section>

            <Footer />
        </>
    )
}
