'use client'
import Link from 'next/link'
import Image from 'next/image'


export default function Footer() {


    return (
        <>


            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div style={{ marginBottom: '12px' }}>
                                <img src="/images/logo-white.svg" alt="Milkali" style={{ height: '44px' }} />
                            </div>
                            <p>Farm-fresh cow milk, tested for safety and delivered to your doorstep every morning. Trusted by 5000+ Mumbai families.</p>
                            <div className="origin-badge" style={{ marginTop: '16px' }}>
                                <div className="origin-badge-circle">
                                    <span className="year">EST&apos;D</span>
                                    <span className="label">Farm Fresh</span>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>Single Origin</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Farm to Home</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4>Shop</h4>
                            <ul>
                                <li><Link href="/products">All Products</Link></li>
                                <li><Link href="/products">500ml Milk Pack</Link></li>
                                <li><Link href="/products">1 Litre Milk Pack</Link></li>
                                <li><Link href="/subscriptions">Subscribe & Save</Link></li>
                                <li><Link href="/b2b">Bulk / Business</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4>Learn</h4>
                            <ul>
                                <li><Link href="/about">Our Story</Link></li>
                                <li><Link href="/about">Our Process</Link></li>
                                <li><Link href="/about">Quality & Safety</Link></li>
                                <li><Link href="/contact">Contact Us</Link></li>
                            </ul>
                            <h4 style={{ marginTop: '24px' }}>Account</h4>
                            <ul>
                                <li><Link href="/auth/login">Login / Sign Up</Link></li>
                                <li><Link href="/dashboard">My Dashboard</Link></li>
                                <li><Link href="/dashboard/wallet">Wallet</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4>Legal</h4>
                            <ul>
                                <li><Link href="/privacy">Privacy Policy</Link></li>
                                <li><Link href="/terms">Terms & Conditions</Link></li>
                                <li><Link href="/refund">Refund Policy</Link></li>
                            </ul>
                            <h4 style={{ marginTop: '24px' }}>Contact Us</h4>
                            <ul>
                                <li><a href="https://wa.me/917710048128" target="_blank" rel="noopener">💬 WhatsApp</a></li>
                                <li><a href="tel:+917710048128">📞 +91 7710048128</a></li>
                                <li><a href="mailto:care@milkali.in">✉️ care@milkali.in</a></li>
                            </ul>
                            <div style={{ marginTop: '20px' }}>
                                <div className="mumbai-badge" style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--gold-400)' }}>
                                    📍 Serving Mumbai & MMR
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <span>© {new Date().getFullYear()} Dairy Delight Milk and Milk Pvt Ltd. All rights reserved. FSSAI Lic: 11262099000XXX</span>
                        <div className="footer-social" style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'center' }}>

                            {/* Instagram */}
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'none', transition: '0.3s' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>

                            {/* Twitter / X */}
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'none', transition: '0.3s' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>

                            {/* Facebook */}
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'none', transition: '0.3s' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                                </svg>
                            </a>

                            {/* YouTube */}
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'none', transition: '0.3s' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}
