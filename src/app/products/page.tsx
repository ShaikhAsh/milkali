'use client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'

function useReveal() {
    useEffect(() => {
        const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children')
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) entry.target.classList.add('visible')
                })
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        )
        elements.forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [])
}

export default function ProductsPage() {
    useReveal()

    const nutritionalData = [
        { label: 'Protein', value: '3.72g', per: 'per 100ml', icon: '💪' },
        { label: 'Fat', value: '3.72g', per: 'per 100ml', icon: '🥛' },
        { label: 'Energy', value: '94kcal', per: 'per 100ml', icon: '⚡' },
        { label: 'Carbs', value: '10.94g', per: 'per 100ml', icon: '🦴' },
        { label: 'Trans Fat', value: '0.5g', per: 'per 100ml', icon: '🥛' },
    ]

    return (
        <>
            <Header />
            <div className="page-banner">
                <h1>Our Products</h1>
                <p>One product, one promise — the purest cow milk in Mumbai</p>
            </div>

            <section className="section">
                <div className="container">
                    <div className="section-header reveal">
                        <div className="section-label">Available Variants</div>
                        <h2>Milkali — Premium Cow Milk</h2>
                        <p>Choose between our 500ml and 1 Litre packs. Perfect for daily home use or subscription orders.</p>
                    </div>
                    <div className="products-grid stagger-children">
                        <div className="product-card reveal-scale">
                            <div className="product-badge">Popular</div>
                            <div className="product-image">
                                <img src="images/instagram/img3.jpeg" alt="500ml Milk" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div className="product-body">
                                <h3>500ml Pack</h3>
                                <p className="product-desc">Ideal for individuals and small families. Fresh, Unadulterated Cow Milk in a sealed packaging.</p>
                                <div className="price-row">
                                    <span className="price-current">₹35</span>
                                    <span className="price-mrp">₹45</span>
                                    <span className="price-save">Save 22%</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', fontSize: '11px' }}>
                                    <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>✓ Lab Tested</span>
                                    <span style={{ background: 'var(--info-bg)', color: 'var(--info)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>Protein</span>
                                </div>
                                <div className="product-actions">
                                    <Link href="/subscriptions" className="btn btn-primary">Subscribe Daily</Link>
                                </div>
                            </div>
                        </div>
                        <div className="product-card reveal-scale">
                            <div className="product-badge" style={{ background: 'var(--navy-800)' }}>Best Value</div>
                            <div className="product-image">
                                <img src="images/instagram/img1.jpg" alt="1 Litre Milk" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div className="product-body">
                                <h3>1 Litre Pack</h3>
                                <p className="product-desc">Best value for families. Premium cow milk delivered fresh every morning in a sealed packaging.</p>
                                <div className="price-row">
                                    <span className="price-current">₹65</span>
                                    <span className="price-mrp">₹80</span>
                                    <span className="price-save">Save 19%</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', fontSize: '11px' }}>
                                    <span style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>✓ Lab Tested</span>
                                    <span style={{ background: 'var(--info-bg)', color: 'var(--info)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>Protein</span>
                                </div>
                                <div className="product-actions">
                                    <Link href="/subscriptions" className="btn btn-primary">Subscribe Daily</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Nutritional Info */}
            <section className="section section-cream">
                <div className="container">
                    <div className="section-header reveal">
                        <div className="section-label">Nutrition</div>
                        <h2>Nutritional Information</h2>
                        <p>Rich in natural protein, calcium, and essential vitamins — with zero artificial additives.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', maxWidth: '800px', margin: '0 auto' }} className="stagger-children">
                        {nutritionalData.map(n => (
                            <div key={n.label} className="card" style={{ padding: '28px 20px', textAlign: 'center', transition: 'all 0.3s ease' }}>
                                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{n.icon}</div>
                                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '32px', fontWeight: 800, color: 'var(--navy-800)' }}>{n.value}</div>
                                <div style={{ fontWeight: 600, color: 'var(--gray-700)', marginTop: '4px' }}>{n.label}</div>
                                <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{n.per}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Our Milk */}
            <section className="section">
                <div className="container">
                    <div className="section-header reveal">
                        <div className="section-label">Why Milkali</div>
                        <h2>What Makes Our Milk Special</h2>
                    </div>
                    <div className="features-grid stagger-children" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                        <div className="feature-card">
                            <div className="feature-icon">🧊</div>
                            <h3>Cold Chain Integrity</h3>
                            <p>Maintained at 4°C from milking to delivery — no breaks in temperature control.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📋</div>
                            <h3>Batch Lab Reports</h3>
                            <p>Every batch comes with a traceable lab report covering fat, SNF, adulteration, and bacterial count.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quality Promise */}
            <section className="section section-cream">
                <div className="container">
                    <div className="cta-banner reveal-scale">
                        <h2>Our Quality Promise</h2>
                        <p>Every glass of Milkali is FSSAI certified, lab-tested, and sourced from verified village farms. Zero adulteration. Zero compromise.</p>
                        <Link href="/subscriptions" className="btn btn-white btn-lg">Start Your Subscription</Link>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    )
}
