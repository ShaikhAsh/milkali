'use client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState } from 'react'

export default function SubscriptionsPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null)

    const faqs = [
        { q: 'How does the subscription work?', a: 'Choose a plan, add your Mumbai address, recharge your wallet, and we deliver fresh milk to your doorstep every morning by 7 AM. Your wallet is debited daily.' },
        { q: 'Can I pause or skip deliveries?', a: 'Absolutely. You can pause, resume, or skip any delivery from your dashboard. Skip requests must be placed before 8 PM the previous day.' },
        { q: 'What if I am not home?', a: 'We deliver between 5-7 AM and leave the milk at your doorstep in insulated packaging. The milk stays fresh for several hours.' },
        { q: 'How do I pay?', a: 'Through our prepaid wallet system. Load your wallet via UPI, Credit/Debit Card, or Net Banking. Your subscription cost is auto-debited daily.' },
        { q: 'Is there a minimum commitment?', a: 'No long-term commitments. You can cancel anytime from your dashboard with zero cancellation fees.' },
    ]

    return (
        <>
            <Header />
            <div className="page-banner">
                <h1>Subscription Plans</h1>
                <p>Choose the plan that fits your household — modify or cancel anytime</p>
            </div>

            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">Choose Your Plan</div>
                        <h2>Simple, Flexible Pricing</h2>
                        <p>All plans include farm-fresh cow milk, morning delivery, and full subscription management from your dashboard.</p>
                    </div>
                    <div className="plans-grid">
                        <div className="plan-card">
                            <h3>Daily</h3>
                            <div style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '20px' }}>Every single day</div>
                            <div className="plan-price">₹35<span>/day (500ml)</span></div>
                            <ul className="plan-features">
                                <li>Fresh milk every morning by 7 AM</li>
                                <li>Skip or pause anytime</li>
                                <li>Wallet auto-debit</li>
                                <li>Change quantity anytime</li>
                                <li>No cancellation fee</li>
                            </ul>
                            <Link href="/auth/login" className="btn btn-secondary btn-block">Get Started</Link>
                        </div>

                        <div className="plan-card featured">
                            <div className="plan-featured-tag">Most Popular</div>
                            <h3>Daily — 1 Litre</h3>
                            <div style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '20px' }}>Best value for families</div>
                            <div className="plan-price">₹65<span>/day (1L)</span></div>
                            <ul className="plan-features">
                                <li>Everything in Daily 500ml</li>
                                <li>Save ₹15 vs buying 2×500ml</li>
                                <li>Priority morning delivery</li>
                                <li>Free glass bottle exchange</li>
                                <li>Premium customer support</li>
                            </ul>
                            <Link href="/auth/login" className="btn btn-primary btn-block">Get Started</Link>
                        </div>

                        <div className="plan-card">
                            <h3>Alternate Day</h3>
                            <div style={{ fontSize: '14px', color: 'var(--gray-500)', marginBottom: '20px' }}>3-4 times per week</div>
                            <div className="plan-price">₹35<span>/delivery</span></div>
                            <ul className="plan-features">
                                <li>Delivery on alternate days</li>
                                <li>Perfect for smaller families</li>
                                <li>Same quality & freshness</li>
                                <li>Flexible scheduling</li>
                                <li>No minimum commitment</li>
                            </ul>
                            <Link href="/auth/login" className="btn btn-secondary btn-block">Get Started</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="section section-navy">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label" style={{ color: 'var(--gold-300)' }}>How It Works</div>
                        <h2>Getting Started is Easy</h2>
                    </div>
                    <div className="steps-row">
                        <div className="step-card">
                            <div className="step-number" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--gold-300)' }}>1</div>
                            <h3 style={{ color: '#fff' }}>Sign Up & Choose</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Create your account and pick your preferred variant and delivery schedule.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--gold-300)' }}>2</div>
                            <h3 style={{ color: '#fff' }}>Recharge Wallet</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Add funds to your prepaid wallet via UPI, card, or net banking.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--gold-300)' }}>3</div>
                            <h3 style={{ color: '#fff' }}>Enjoy Fresh Milk</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Receive farm-fresh milk at your doorstep every morning. Manage everything from your dashboard.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="section section-cream">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">FAQ</div>
                        <h2>Frequently Asked Questions</h2>
                    </div>
                    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                        {faqs.map((faq, i) => (
                            <div key={i} className="card" style={{ marginBottom: '8px', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--navy-800)', fontSize: '15px' }}>{faq.q}</span>
                                    <span style={{ fontSize: '18px', color: 'var(--gray-400)', transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                                </div>
                                {openFaq === i && (
                                    <div style={{ padding: '0 24px 18px', fontSize: '14px', color: 'var(--gray-600)', lineHeight: 1.7 }}>{faq.a}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </>
    )
}
