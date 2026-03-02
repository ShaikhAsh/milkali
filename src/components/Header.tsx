'use client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function Header() {
    const { user, logout } = useAuth()
    const [scrolled, setScrolled] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [pincode, setPincode] = useState('')
    const [pinResult, setPinResult] = useState<null | boolean>(null)
    const [shopOpen, setShopOpen] = useState(false)

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', handler)
        return () => window.removeEventListener('scroll', handler)
    }, [])

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [drawerOpen])

    // Mumbai pincodes (serviceable)
    const serviceablePins = [
        '400001', '400002', '400003', '400004', '400005', '400006', '400007', '400008', '400009', '400010',
        '400011', '400012', '400013', '400014', '400015', '400016', '400017', '400018', '400019', '400020',
        '400021', '400022', '400023', '400024', '400025', '400026', '400027', '400028', '400029', '400030',
        '400031', '400032', '400033', '400034', '400035', '400036', '400037', '400038', '400039', '400040',
        '400041', '400042', '400043', '400044', '400045', '400046', '400047', '400048', '400049', '400050',
        '400051', '400052', '400053', '400054', '400055', '400056', '400057', '400058', '400059', '400060',
        '400061', '400062', '400063', '400064', '400065', '400066', '400067', '400068', '400069', '400070',
        '400071', '400072', '400073', '400074', '400075', '400076', '400077', '400078', '400079', '400080',
        '400081', '400082', '400083', '400084', '400085', '400086', '400087', '400088', '400089', '400090',
        '400091', '400092', '400093', '400094', '400095', '400096', '400097', '400098', '400099', '400100',
        '400101', '400102', '400103', '400104', '401101', '401107', '410206', '410210', '421301', '421302'
    ]

    const checkPincode = (val: string) => {
        setPincode(val)
        if (val.length === 6) {
            setPinResult(serviceablePins.includes(val))
        } else {
            setPinResult(null)
        }
    }

    const navItems = [
        { href: '/', label: 'Home' },
        { href: '/products', label: 'Shop', hasDropdown: true },
        { href: '/subscriptions', label: 'Subscribe' },
        { href: '/about', label: 'Our Story' },
        { href: '/b2b', label: 'For Business' },
        { href: '/contact', label: 'Contact' },
    ]

    return (
        <>
            <div className="announcement-bar">
                New to Milkali? Get your first 5 litres at just ₹149 — <Link href="/subscriptions">Subscribe Now →</Link>
            </div>
            <header className={`header ${scrolled ? 'scrolled' : ''}`}>
                <div className="header-inner">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link href="/" className="logo">
                            <img src="/images/logo.svg" alt="Milkali" className="logo-img" />
                        </Link>
                        <div className="pincode-checker">
                            <span className="pin-icon">📍</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="PIN Code"
                                value={pincode}
                                onChange={(e) => checkPincode(e.target.value.replace(/\D/g, ''))}
                            />
                            {pinResult !== null && (
                                <span className={`pincode-result ${pinResult ? 'serviceable' : 'not-serviceable'}`}>
                                    {pinResult ? '✓ We deliver!' : '✕ Not yet'}
                                </span>
                            )}
                        </div>
                    </div>

                    <nav className="nav-links">
                        {navItems.map(item => (
                            item.hasDropdown ? (
                                <div
                                    key={item.href}
                                    style={{ position: 'relative' }}
                                    onMouseEnter={() => setShopOpen(true)}
                                    onMouseLeave={() => setShopOpen(false)}
                                >
                                    <Link href={item.href}>{item.label} ▾</Link>
                                    {shopOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: '-20px',
                                            background: '#fff',
                                            border: '1px solid var(--gray-200)',
                                            borderRadius: '12px',
                                            padding: '12px 0',
                                            minWidth: '180px',
                                            boxShadow: '0 10px 40px rgba(0,34,68,0.1)',
                                            zIndex: 101,
                                            animation: 'fadeIn 0.2s ease-out'
                                        }}>
                                            <Link href="/products" style={{ display: 'block', padding: '10px 24px', fontSize: '14px', fontWeight: 500 }}>
                                                🥛 All Products
                                            </Link>
                                            <Link href="/products" style={{ display: 'block', padding: '10px 24px', fontSize: '14px', fontWeight: 500 }}>
                                                🍼 500ml Pack
                                            </Link>
                                            <Link href="/products" style={{ display: 'block', padding: '10px 24px', fontSize: '14px', fontWeight: 500 }}>
                                                🥛 1 Litre Pack
                                            </Link>
                                            <div style={{ borderTop: '1px solid var(--gray-100)', margin: '8px 0' }} />
                                            <Link href="/subscriptions" style={{ display: 'block', padding: '10px 24px', fontSize: '14px', fontWeight: 500, color: 'var(--gold-700)' }}>
                                                📅 Subscribe & Save
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link key={item.href} href={item.href}>{item.label}</Link>
                            )
                        ))}
                    </nav>

                    <div className="nav-actions">
                        {user ? (
                            <>
                                {user.role === 'ADMIN' && (
                                    <Link href="/admin" className="nav-icon-btn" title="Admin">🔑</Link>
                                )}
                                <Link href="/dashboard" className="btn btn-ghost btn-sm">Dashboard</Link>
                                <button onClick={logout} className="btn btn-sm" style={{ background: 'transparent', color: 'var(--gray-500)', border: '1px solid var(--gray-200)' }}>Logout</button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/login" className="btn btn-ghost btn-sm">Login</Link>
                                <Link href="/auth/signup" className="btn btn-primary btn-sm">Sign Up</Link>
                            </>
                        )}
                        <button className="mobile-toggle" onClick={() => setDrawerOpen(true)} aria-label="Menu">☰</button>
                    </div>
                </div>
            </header>

            {/* Mobile drawer */}
            {drawerOpen && <div className="mobile-overlay" style={{ display: 'block' }} onClick={() => setDrawerOpen(false)} />}
            <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
                <button className="mobile-close" onClick={() => setDrawerOpen(false)}>✕</button>
                <div style={{ padding: '0 4px', marginBottom: '24px' }}>
                    <img src="/images/logo.svg" alt="Milkali" style={{ height: '40px' }} />
                </div>
                <ul>
                    {navItems.map(item => (
                        <li key={item.href}><Link href={item.href} onClick={() => setDrawerOpen(false)}>{item.label}</Link></li>
                    ))}
                    <li style={{ marginTop: '16px' }}>
                        {user ? (
                            <>
                                <Link href="/dashboard" onClick={() => setDrawerOpen(false)} className="btn btn-primary btn-block" style={{ marginTop: '8px', color: '#fff' }}>My Dashboard</Link>
                                <button onClick={() => { setDrawerOpen(false); logout() }} className="btn btn-ghost btn-block" style={{ marginTop: '8px' }}>Logout</button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth/login" onClick={() => setDrawerOpen(false)} className="btn btn-ghost btn-block" style={{ marginTop: '8px' }}>Login</Link>
                                <Link href="/auth/signup" onClick={() => setDrawerOpen(false)} className="btn btn-primary btn-block" style={{ marginTop: '8px', color: '#fff' }}>Sign Up</Link>
                            </>
                        )}
                    </li>
                </ul>
            </div>
        </>
    )
}
