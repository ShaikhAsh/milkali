'use client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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

export default function AboutPage() {
    useReveal()

    return (
        <>
            <Header />
            <div className="page-banner">
                <h1>Our Story</h1>
                <p>From village farms to Mumbai doorsteps — the Milkali journey</p>
            </div>

            {/* Brand Story */}
            <section className="section">
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
                        <div className="reveal-left">
                            <div className="section-label" style={{ justifyContent: 'flex-start', marginBottom: '16px' }}>
                                Our Story
                            </div>

                            <h2 style={{ fontSize: '40px', marginBottom: '20px' }}>
                                Pure, Safe and Consistent — Every Single Day
                            </h2>

                            <p style={{ fontSize: '16px', color: 'var(--gray-600)', lineHeight: 1.8, marginBottom: '16px' }}>
                                Milkali was started with a simple belief — every family deserves milk that is pure, safe and consistent every single day.
                            </p>

                            <p style={{ fontSize: '16px', color: 'var(--gray-600)', lineHeight: 1.8, marginBottom: '16px' }}>
                                In today’s fast life, people often compromise on quality without realizing it. At Milkali, we work to remove that worry.
                                From sourcing to handling and delivery, we focus on hygiene, freshness and trust so you can serve your family milk with complete confidence.
                            </p>

                            <p style={{ fontSize: '16px', color: 'var(--gray-600)', lineHeight: 1.8, marginBottom: '24px' }}>
                                We are not just supplying milk — we are building a habit of healthy mornings in every home we serve.
                            </p>

                            <div className="mumbai-badge">📍 Proudly Serving Mumbai & MMR</div>
                        </div>

                        <div className="reveal-right">
                            <Image
                                src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&h=500&fit=crop"
                                alt="Lush green farmland with healthy cows — Milkali cow milk source"
                                width={600}
                                height={500}
                                style={{ width: '100%', borderRadius: 'var(--radius-xl)', objectFit: 'cover', aspectRatio: '6/5', boxShadow: '0 20px 60px rgba(0,46,91,0.12)' }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="section section-cream">
                <div className="container">
                    <div className="section-header reveal">
                        <div className="section-label">Vision & Mission</div>
                        <h2>Our Commitment</h2>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: '32px',
                            maxWidth: '1000px',
                            margin: '0 auto'
                        }}
                        className="stagger-children"
                    >

                        {/* Vision Card */}
                        <div className="feature-card reveal-scale" style={{ padding: '40px' }}>
                            <div
                                className="feature-icon"
                                style={{ marginBottom: '20px', fontSize: '28px' }}
                            >
                                🔭
                            </div>
                            <h3 style={{ marginBottom: '16px' }}>Our Vision</h3>
                            <p style={{ color: 'var(--gray-600)', lineHeight: 1.8 }}>
                                To become the most trusted daily milk brand for families by delivering purity,
                                consistency and peace of mind in every glass.
                                We aim to redefine everyday milk consumption from a routine purchase
                                to a reliable health choice.
                            </p>
                        </div>

                        {/* Mission Card */}
                        <div className="feature-card reveal-scale" style={{ padding: '40px' }}>
                            <div
                                className="feature-icon"
                                style={{ marginBottom: '20px', fontSize: '28px' }}
                            >
                                🎯
                            </div>

                            <h3 style={{ marginBottom: '24px' }}>Our Mission</h3>

                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {[
                                    "To provide fresh and hygienically handled milk every day",
                                    "To maintain consistent taste and quality across every delivery",
                                    "To ensure safe handling and responsible sourcing",
                                    "To build long-term trust with families through transparency and reliability",
                                    "To promote better nutrition and healthier lifestyles"
                                ].map((item, index) => (
                                    <li
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '14px',
                                            marginBottom: '16px',
                                            color: 'var(--gray-600)',
                                            lineHeight: 1.8
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: '10px',
                                                height: '10px',
                                                background: 'var(--gold-400)',
                                                borderRadius: '50%',
                                                marginTop: '7px',
                                                flexShrink: 0,
                                                boxShadow: '0 0 0 4px rgba(212,175,55,0.15)'
                                            }}
                                        />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>
            </section>


            {/* Values */}
            <section className="section section-cream">
                <div className="container">
                    <div className="section-header reveal">
                        <div className="section-label">Our Values</div>
                        <h2>What We Stand For</h2>
                    </div>
                    <div className="features-grid stagger-children">
                        <div className="feature-card" style={{ textAlign: 'center' }}>
                            <div className="feature-icon" style={{ margin: '0 auto 20px' }}>🌱</div>
                            <h3>Purity</h3>
                            <p>Zero adulteration, zero preservatives, zero artificial hormones. Just milk as nature intended.</p>
                        </div>
                        <div className="feature-card" style={{ textAlign: 'center' }}>
                            <div className="feature-icon" style={{ margin: '0 auto 20px' }}>🤝</div>
                            <h3>Fair Trade</h3>
                            <p>We pay our farmers fairly — better prices for better milk. Our success is their success.</p>
                        </div>
                        <div className="feature-card" style={{ textAlign: 'center' }}>
                            <div className="feature-icon" style={{ margin: '0 auto 20px' }}>♻️</div>
                            <h3>Sustainability</h3>
                            <p>Efficient packaging, responsible sourcing, and optimized delivery routes to reduce waste and environmental impact across Mumbai.</p>
                        </div>

                        <div className="feature-card" style={{ textAlign: 'center' }}>
                            <div className="feature-icon" style={{ margin: '0 auto 20px' }}>🏆</div>
                            <h3>Transparency</h3>
                            <p>Every batch comes with a lab report you can view. Know exactly what&apos;s in your glass.</p>
                        </div>
                        <div className="feature-card" style={{ textAlign: 'center' }}>
                            <div className="feature-icon" style={{ margin: '0 auto 20px' }}>🐄</div>
                            <h3>Animal Welfare</h3>
                            <p>Our cows are treated like family — humanely raised, grass-fed, and never injected with hormones.</p>
                        </div>
                        <div className="feature-card" style={{ textAlign: 'center' }}>
                            <div className="feature-icon" style={{ margin: '0 auto 20px' }}>🏡</div>
                            <h3>Community</h3>
                            <p>Supporting rural livelihoods while serving urban households — building bridges between village and city.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Farm to Glass Journey */}
            <section className="section">
                <div className="container">
                    <div className="section-header reveal">
                        <div className="section-label">Our Process</div>
                        <h2>Farm to Glass Journey</h2>
                        <p>Every step from milking to your doorstep, carried out with precision and care.</p>
                    </div>
                    <div className="journey-timeline stagger-children">
                        <div className="journey-step">
                            <div className="journey-icon">🌅</div>
                            <h4>Early Morning Milking</h4>
                            <p>Our farmers begin milking at 4 AM. Fresh milk from healthy, grass-fed desi cows.</p>
                        </div>
                        <div className="journey-step">
                            <div className="journey-icon">🔬</div>
                            <h4>In-House Lab Testing</h4>
                            <p>Every batch tested for fat content, SNF, adulteration markers, and bacterial count.</p>
                        </div>
                        <div className="journey-step">
                            <div className="journey-icon">❄️</div>
                            <h4>Cold Chain Packaging</h4>
                            <p>Milk is chilled to 4°C and sealed in sanitized glass bottles within 30 minutes.</p>
                        </div>
                        <div className="journey-step">
                            <div className="journey-icon">🏠</div>
                            <h4>Doorstep by 7 AM</h4>
                            <p>Insulated delivery bags ensure the milk reaches you fresh, pure, and cold.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="section section-navy">
                <div className="container">
                    <div className="section-header reveal">
                        <div className="section-label" style={{ color: 'var(--gold-300)' }}>Our Team</div>
                        <h2>Built by People Who Care</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)' }}>A small, passionate team dedicated to bringing you the purest milk possible.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px', maxWidth: '900px', margin: '0 auto' }} className="stagger-children">
                        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>👨‍💼</div>
                            <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '4px' }}>Founder & CEO</h3>
                            <p style={{ color: 'var(--gold-400)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Operations & Strategy</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>👩‍🔬</div>
                            <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '4px' }}>Quality Head</h3>
                            <p style={{ color: 'var(--gold-400)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Lab & Testing</p>
                        </div>
                        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>🚚</div>
                            <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '4px' }}>Logistics Lead</h3>
                            <p style={{ color: 'var(--gold-400)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Delivery Network</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section">
                <div className="container">
                    <div className="cta-banner reveal-scale">
                        <h2>Taste the Difference</h2>
                        <p>Experience the real taste of pure cow milk. Start your subscription today.</p>
                        <a href="/subscriptions" className="btn btn-white btn-lg">Subscribe Now</a>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    )
}
