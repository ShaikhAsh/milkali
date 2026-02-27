'use client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

// Animated counter hook
function useCounter(end: number, duration: number = 2000, suffix: string = '') {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const steps = 60
    const increment = end / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [started, end, duration])

  return { count, ref, suffix }
}

// Scroll reveal hook
function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

// Parallax hook
function useParallax() {
  useEffect(() => {
    const heroImg = document.querySelector('.hero-image-wrap') as HTMLElement | null
    if (!heroImg) return
    const handler = () => {
      const scrollY = window.scrollY
      heroImg.style.transform = `translateY(${scrollY * 0.15}px)`
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
}

export default function HomePage() {
  const { user } = useAuth()
  useReveal()
  useParallax()

  // Freshness timer - hours since morning milking
  const getHoursSinceMilking = () => {
    const now = new Date()
    const milkingHour = 4 // 4 AM milking
    let hours = now.getHours() - milkingHour
    if (hours < 0) hours += 24
    return hours
  }

  const [freshHours] = useState(getHoursSinceMilking())

  // Pincode delivery check
  const [pincodeCheck, setPincodeCheck] = useState('')
  const [pincodeResult, setPincodeResult] = useState<null | boolean>(null)
  const serviceablePins = ['400001', '400002', '400003', '400004', '400005', '400006', '400007', '400008', '400009', '400010', '400011', '400012', '400013', '400014', '400015', '400016', '400017', '400018', '400019', '400020', '400021', '400022', '400023', '400024', '400025', '400026', '400027', '400028', '400029', '400030', '400031', '400032', '400033', '400034', '400035', '400036', '400037', '400038', '400039', '400040', '400041', '400042', '400043', '400044', '400045', '400046', '400047', '400048', '400049', '400050', '400051', '400052', '400053', '400054', '400055', '400056', '400057', '400058', '400059', '400060', '400061', '400062', '400063', '400064', '400065', '400066', '400067', '400068', '400069', '400070', '400071', '400072', '400073', '400074', '400075', '400076', '400077', '400078', '400079', '400080', '400081', '400082', '400083', '400084', '400085', '400086', '400087', '400088', '400089', '400090', '400091', '400092', '400093', '400094', '400095', '400096', '400097', '400098', '400099', '400100']

  // Counter refs
  const stat1 = useCounter(5000, 2000)
  const stat2 = useCounter(100000, 2500)
  const stat3 = useCounter(49, 1500)
  const stat4 = useCounter(365, 2000)

  return (
    <>
      <Header />

      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <div className="freshness-badge">
              <div className="pulse-dot" />
              Milked {freshHours} hours ago — delivered fresh to you
            </div>
            <h1>
              Cow <em>Milk</em>
            </h1>
            <p className="hero-desc">
              Unadulterated cow milk from indigenous Indian cow breeds.
              Delivered fresh from village farms to your Mumbai doorstep every morning by 7 AM.
            </p>
            <div className="hero-cta-row">
              <Link href="/subscriptions" className="btn btn-primary btn-lg">Subscribe Now</Link>
              <Link href="/products" className="btn btn-secondary btn-lg">Explore Products</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrap">
              <img
                src="images/instagram/img3.jpeg"
                alt="Fresh milk being poured into a glass"
                style={{ aspectRatio: '5/6' }}
              />
            </div>
            <div className="hero-float-card">
              <div className="hfc-icon">🥛</div>
              <div>
                <div className="hfc-label">Starting at</div>
                <div className="hfc-value">₹35/day</div>
              </div>
            </div>
            <div className="hero-float-card-2">
              <div className="hfc-icon">🧪</div>
              <div>
                <div className="hfc-label">Lab Report</div>
                <div className="hfc-value">100% Pure</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <div className="trust-strip">
        <div className="trust-strip-inner">
          <div className="trust-item"><span>🐄</span> 100% COW MILK</div>
          <div className="trust-item"><span>🧪</span> Lab Tested Daily</div>
          <div className="trust-item"><span>🌿</span> Zero Preservatives</div>
          <div className="trust-item"><span>🏡</span> Single Origin Farm</div>
          <div className="trust-item"><span>🚚</span> 5 AM – 7 AM Delivery</div>
        </div>
      </div>

      {/* ═══ ANIMATED STATS BANNER ═══ */}
      <section className="stats-banner">
        <div className="stats-inner stagger-children">
          <div className="stat-counter" ref={stat1.ref}>
            <div className="stat-number">{stat1.count.toLocaleString()}<span>+</span></div>
            <div className="stat-counter-label">Happy Families</div>
          </div>
          <div className="stat-counter" ref={stat2.ref}>
            <div className="stat-number">{stat2.count.toLocaleString()}<span>+</span></div>
            <div className="stat-counter-label">Litres Delivered</div>
          </div>
          <div className="stat-counter" ref={stat3.ref}>
            <div className="stat-number">{(stat3.count / 10).toFixed(1)}<span>★</span></div>
            <div className="stat-counter-label">Customer Rating</div>
          </div>
          <div className="stat-counter" ref={stat4.ref}>
            <div className="stat-number">{stat4.count}<span>+</span></div>
            <div className="stat-counter-label">Days of Freshness</div>
          </div>
        </div>
      </section>

      {/* ═══ WHY MILK ALI ═══ */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-label">Why Choose Us</div>
            <h2>The Milkali Promise</h2>
            <p>Every glass of Milkali carries the goodness of pure A2 desi cow milk — from healthy, well-cared-for cows on lush village farms.</p>
          </div>
          <div className="features-grid stagger-children">
            <div className="feature-card">
              <div className="feature-icon">🏡</div>
              <h3>Farm to Glass</h3>
              <p>Sourced directly from village farms. No middlemen, no processing plants. Just pure, fresh milk delivered within hours of milking.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧬</div>
              <h3>Cow Milk</h3>
              <p>From indigenous Indian cow breeds known for milk rich in A2 beta-casein protein — easier to digest and more nutritious.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧪</div>
              <h3>Lab Tested Purity</h3>
              <p>Every batch is rigorously tested for purity, adulteration, and quality. We maintain FSSAI compliance at every step.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Flexible Subscriptions</h3>
              <p>Pause, skip, or modify your delivery anytime. Our calendar-based subscription gives you complete control.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏰</div>
              <h3>Morning Delivery</h3>
              <p>Fresh milk at your doorstep between 5:00 AM — 7:00 AM, every single day. Because freshness can&apos;t wait.</p>
            </div>
            <div className="feature-card" style={{ textAlign: 'left' }}>
              <div className="feature-icon">♻️</div>
              <h3>Sustainability</h3>
              <p>Efficient packaging, responsible sourcing, and optimized delivery routes to reduce waste and environmental impact across Mumbai.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ FARM TO GLASS JOURNEY ═══ */}
      <section className="section">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-label">Our Process</div>
            <h2>Farm to Glass Journey</h2>
            <p>Untouched by human hands — our milk travels from farm to your home through a fully automated, hygienic process.</p>
          </div>
          <div className="journey-timeline stagger-children">
            <div className="journey-step">
              <div className="journey-icon">🐄</div>
              <h4>Farm Sourced</h4>
              <p>Our desi cows graze on organic fodder in clean, open-air village farms.</p>
            </div>
            <div className="journey-step">
              <div className="journey-icon">🔬</div>
              <h4>Lab Tested</h4>
              <p>Every batch tested for purity, fat content, SNF, and adulteration in our in-house laboratory.</p>
            </div>
            <div className="journey-step">
              <div className="journey-icon">❄️</div>
              <h4>Cold Chain</h4>
              <p>Maintained at 4°C from milking to delivery — preserving freshness without any preservatives.</p>
            </div>
            <div className="journey-step">
              <div className="journey-icon">🏠</div>
              <h4>At Your Door</h4>
              <p>Delivered in sanitized glass bottles at your doorstep before 7 AM, 365 days a year.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ OUR PRODUCTS ═══ */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-label">Our Products</div>
            <h2>Premium Desi Cow Milk</h2>
            <p>One product. Uncompromising quality. Available in two convenient sizes for homes and families across Mumbai.</p>
          </div>
          <div className="products-grid stagger-children">
            <div className="product-card reveal-scale">
              <div className="product-badge">Popular</div>
              <div className="product-image">
                <img src="images/instagram/img3.jpeg" alt="500ml Milk" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="product-body">
                <h3>500ml Pack</h3>
                <p className="product-desc">Perfect for individuals and small families. Fresh desi cow milk in a hygienic glass bottle.</p>
                <div className="price-row">
                  <span className="price-current">₹35</span>
                  <span className="price-mrp">₹45</span>
                  <span className="price-save">Save 22%</span>
                </div>
                <div className="product-actions">
                  <Link href="/subscriptions" className="btn btn-primary">Subscribe</Link>
                  <Link href="/products" className="btn btn-ghost">Details</Link>
                </div>
              </div>
            </div>
            <div className="product-card reveal-scale">
              <div className="product-badge" style={{ background: 'var(--navy-800)' }}>Value</div>
              <div className="product-image">
                <img src="images/instagram/img1.jpg" alt="1 Litre Milk" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="product-body">
                <h3>1 Litre Pack</h3>
                <p className="product-desc">Best value for families. Premium desi cow milk delivered fresh in a sealed glass bottle.</p>
                <div className="price-row">
                  <span className="price-current">₹65</span>
                  <span className="price-mrp">₹80</span>
                  <span className="price-save">Save 19%</span>
                </div>
                <div className="product-actions">
                  <Link href="/subscriptions" className="btn btn-primary">Subscribe</Link>
                  <Link href="/products" className="btn btn-ghost">Details</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHY NOT PACKET MILK? (UNIQUE) ═══ */}
      <section className="section comparison-section">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-label">The Difference</div>
            <h2>Why Not Packet Milk?</h2>
            <p>See what you&apos;re really putting in your glass. The choice is clear.</p>
          </div>
          <div className="comparison-table reveal-scale">
            <div className="comparison-header">
              <span>Quality Factor</span>
              <span>Milkali</span>
              <span>Other Milk</span>
            </div>
            <div className="comparison-row">
              <span>A2 Protein (Easy Digestion)</span>
              <span className="comparison-check">✓</span>
              <span className="comparison-cross">✕</span>
            </div>
            <div className="comparison-row">
              <span>Same-Day Farm Fresh</span>
              <span className="comparison-check">✓</span>
              <span className="comparison-cross">✕</span>
            </div>
            <div className="comparison-row">
              <span>Lab Report Available</span>
              <span className="comparison-check">✓</span>
              <span className="comparison-cross">✕</span>
            </div>
            <div className="comparison-row">
              <span>Know Your Source</span>
              <span className="comparison-check">✓</span>
              <span className="comparison-cross">✕</span>
            </div>
            <div className="comparison-row">
              <span>Cold Chain Maintained</span>
              <span className="comparison-check">✓</span>
              <span className="comparison-cross">✕</span>
            </div>
            <div className="comparison-row">
              <span>Starting Price</span>
              <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '15px' }}>₹35</span>
              <span style={{ color: 'var(--gray-400)', fontSize: '15px' }}>₹28-32</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PINCODE CHECKER CTA ═══ */}
      <section className="pincode-section">
        <div className="pincode-section-inner reveal">
          <h2>Do We Deliver to You?</h2>
          <p>Enter your pincode to check if Milkali delivers fresh milk to your area.</p>
          <div className="pincode-input-row">
            <input
              type="text"
              maxLength={6}
              placeholder="Enter Pincode"
              value={pincodeCheck}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setPincodeCheck(val)
                if (val.length === 6) {
                  setPincodeResult(serviceablePins.includes(val))
                } else {
                  setPincodeResult(null)
                }
              }}
            />
            <button
              className="btn btn-gold btn-lg"
              onClick={() => {
                if (pincodeCheck.length === 6) {
                  setPincodeResult(serviceablePins.includes(pincodeCheck))
                }
              }}
            >
              Check Delivery
            </button>
          </div>
          {pincodeResult !== null && (
            <div className={`pincode-delivery-result ${pincodeResult ? 'success' : 'error'}`}>
              {pincodeResult
                ? '🎉 Great news! We deliver to your area. Subscribe today!'
                : '😔 Sorry, we don\'t deliver to this area yet. We\'re expanding soon!'}
            </div>
          )}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="section section-navy">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-label" style={{ color: 'var(--gold-300)' }}>How It Works</div>
            <h2>Fresh Milk in 3 Simple Steps</h2>
            <p>Getting farm-fresh milk delivered is easier than you think.</p>
          </div>
          <div className="steps-row stagger-children">
            <div className="step-card">
              <div className="step-number" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--gold-300)' }}>1</div>
              <h3 style={{ color: '#fff' }}>Choose Your Plan</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>Select daily, alternate day, or weekly delivery and pick your preferred size.</p>
            </div>
            <div className="step-card">
              <div className="step-number" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--gold-300)' }}>2</div>
              <h3 style={{ color: '#fff' }}>Add Your Address</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>Enter your Mumbai delivery address and recharge your prepaid wallet.</p>
            </div>
            <div className="step-card">
              <div className="step-number" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--gold-300)' }}>3</div>
              <h3 style={{ color: '#fff' }}>Enjoy Fresh Milk</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)' }}>Wake up to farm-fresh desi cow milk at your doorstep every morning by 7 AM.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SUSTAINABILITY (UNIQUE) ═══ */}
      <section className="section">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-label">Our Impact</div>
            <h2>Sustainability Matters</h2>
            <p>By choosing Milkali&apos;s glass bottles over plastic packets, you&apos;re making a real difference.</p>
          </div>
          <div className="sustainability-grid stagger-children">
            <div className="sustainability-card">
              <div className="sustainability-icon">🍃</div>
              <h4>15,000+</h4>
              <p>Plastic bottles saved every month</p>
            </div>
            <div className="sustainability-card">
              <div className="sustainability-icon">🌍</div>
              <h4>2.5 Tons</h4>
              <p>CO₂ emissions reduced annually</p>
            </div>
            <div className="sustainability-card">
              <div className="sustainability-icon">♻️</div>
              <h4>98%</h4>
              <p>Bottle return & reuse rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="section section-cream">
        <div className="container">
          <div className="section-header reveal">
            <div className="section-label">Testimonials</div>
            <h2>What Our Customers Say</h2>
            <p>Trusted by thousands of families and businesses across Mumbai.</p>
          </div>
          <div className="testimonials-grid stagger-children">
            <div className="testimonial-card">
              <div className="testimonial-stars">★ ★ ★ ★ ★</div>
              <p className="testimonial-text">&ldquo;The taste is incredible — it reminds me of the milk I had growing up in my village. My children love it. Thank you Milkali!&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">PS</div>
                <div>
                  <div className="testimonial-name">Priya Sharma</div>
                  <div className="testimonial-loc">Andheri West, Mumbai</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★ ★ ★ ★ ★</div>
              <p className="testimonial-text">&ldquo;We switched our entire cafe to Milkali. The cream is thick, the taste is authentic, and our customers noticed the difference immediately.&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">RK</div>
                <div>
                  <div className="testimonial-name">Rajesh Kapoor</div>
                  <div className="testimonial-loc">Cafe Owner, Bandra</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★ ★ ★ ★ ★</div>
              <p className="testimonial-text">&ldquo;The subscription system is so convenient — pause, skip, change quantity — all from my phone. And the glass bottles feel so premium!&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">AM</div>
                <div>
                  <div className="testimonial-name">Anjali Mehta</div>
                  <div className="testimonial-loc">Powai, Mumbai</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ REFERRAL BANNER (UNIQUE) ═══ */}
      <section className="section">
        <div className="container">
          <div className="referral-banner reveal-scale">
            <div className="referral-content">
              <h3>Refer a Friend, Earn Free Milk</h3>
              <p>Share Milkali with your friends. When they receive their first 5 litres, you earn 0.5L of free milk credit — real milk, not coupons.</p>
              {user ? (
                <Link href="/dashboard/referrals" className="btn btn-primary" style={{ marginTop: '16px' }}>Refer Now →</Link>
              ) : (
                <Link href="/auth/signup?redirect=/dashboard/referrals" className="btn btn-primary" style={{ marginTop: '16px' }}>Sign Up to Start Referring →</Link>
              )}
            </div>
            <div className="referral-reward">
              <div className="referral-amount">0.5L</div>
              <p>Free Milk</p>
            </div>
          </div>
        </div>
      </section>



      {/* ═══ CTA BANNER ═══ */}
      <section className="section">
        <div className="container">
          <div className="cta-banner reveal-scale">
            <h2>Start Your Pure Milk Journey</h2>
            <p>Join 5,000+ Mumbai families who wake up to farm-fresh desi cow milk every morning.</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/subscriptions" className="btn btn-white btn-lg">Subscribe Now</Link>
              <Link href="/contact" className="btn btn-secondary btn-lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
