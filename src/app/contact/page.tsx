'use client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useState } from 'react'
import { buildWhatsAppUrl } from '@/lib/whatsapp'

const SUPPORT_PHONE = '+91 77100 48128'
const SUPPORT_EMAIL = 'care@milkali.com'

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
    const [submitting, setSubmitting] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string; ticketNumber?: number } | null>(null)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        setError('')
        setResult(null)

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, type: 'GENERAL' }),
            })
            const data = await res.json()

            if (res.ok && data.success) {
                setResult({ success: true, message: data.data?.message || 'Message sent!', ticketNumber: data.data?.ticketNumber })
                setForm({ name: '', email: '', phone: '', subject: '', message: '' })
            } else {
                setError(data.error || 'Failed to send message. Please try again.')
            }
        } catch {
            setError('Network error. Please check your connection and try again.')
        }
        setSubmitting(false)
    }

    return (
        <>
            <Header />
            <div className="page-banner">
                <h1>Get In Touch</h1>
                <p>We&apos;d love to hear from you — reach out anytime</p>
            </div>

            <section className="section">
                <div className="container">
                    <div className="contact-grid">
                        {/* ─── Contact Info ─── */}
                        <div>
                            <div className="section-label" style={{ justifyContent: 'flex-start', marginBottom: '24px' }}>Contact Info</div>
                            <div className="contact-info-item">
                                <div className="ci-icon">📧</div>
                                <div>
                                    <h4>Email</h4>
                                    <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--navy-600)', textDecoration: 'none', fontWeight: 500 }}>
                                        {SUPPORT_EMAIL}
                                    </a>
                                </div>
                            </div>
                            <div className="contact-info-item">
                                <div className="ci-icon">📞</div>
                                <div>
                                    <h4>Phone</h4>
                                    <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} style={{ color: 'var(--navy-600)', textDecoration: 'none', fontWeight: 500 }}>
                                        {SUPPORT_PHONE}
                                    </a>
                                </div>
                            </div>
                            <div className="contact-info-item">
                                <div className="ci-icon" style={{ fontSize: '24px' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                </div>
                                <div>
                                    <h4>WhatsApp</h4>
                                    <a href={buildWhatsAppUrl('Hi Milkali Support, I need help.')} target="_blank" rel="noopener noreferrer"
                                        style={{ color: '#25D366', textDecoration: 'none', fontWeight: 600 }}>
                                        Chat with us →
                                    </a>
                                </div>
                            </div>
                            <div className="contact-info-item">
                                <div className="ci-icon">⏰</div>
                                <div>
                                    <h4>Support Hours</h4>
                                    <p>Mon — Sat, 8:00 AM — 8:00 PM</p>
                                </div>
                            </div>
                            <div className="contact-info-item">
                                <div className="ci-icon">📍</div>
                                <div>
                                    <h4>Office</h4>
                                    <p>Dairy Delight Milk and Milk Pvt Ltd<br />Mumbai, Maharashtra, India</p>
                                </div>
                            </div>
                        </div>

                        {/* ─── Form / Success ─── */}
                        <div>
                            {result?.success ? (
                                <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
                                    <h3 style={{ marginBottom: '8px', color: 'var(--navy-800)' }}>Message Sent!</h3>
                                    {result.ticketNumber && (
                                        <div style={{ background: 'var(--cream-50, #fefcf3)', borderRadius: '12px', padding: '16px', margin: '16px 0', display: 'inline-block' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Your Ticket Number</div>
                                            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--navy-800)' }}>#{result.ticketNumber}</div>
                                        </div>
                                    )}
                                    <p style={{ color: 'var(--gray-500)', lineHeight: 1.7 }}>
                                        We&apos;ve sent a confirmation email to your inbox.<br />
                                        Our team will respond within <strong>24 hours</strong>.
                                    </p>
                                    <button onClick={() => setResult(null)} className="btn btn-ghost" style={{ marginTop: '16px' }}>
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="card" style={{ padding: '32px' }}>
                                    <h3 style={{ marginBottom: '24px', fontSize: '24px', color: 'var(--navy-800)' }}>Send Us a Message</h3>

                                    {error && (
                                        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                                            {error}
                                            <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '16px' }}>×</button>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Name *</label>
                                            <input className="form-input" required maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Email *</label>
                                            <input className="form-input" type="email" required maxLength={255} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label className="form-label">Phone</label>
                                            <input className="form-input" maxLength={20} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Subject</label>
                                            <input className="form-input" maxLength={200} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="What's this about?" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Message *</label>
                                        <textarea className="form-input" required minLength={10} maxLength={5000} rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" />
                                        <div style={{ fontSize: '11px', color: 'var(--gray-400)', textAlign: 'right', marginTop: '4px' }}>{form.message.length}/5000</div>
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
                                        {submitting ? 'Sending...' : 'Send Message'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    )
}
