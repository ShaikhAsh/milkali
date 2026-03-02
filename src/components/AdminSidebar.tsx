'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface AdminSidebarProps {
    userEmail: string
}

export default function AdminSidebar({ userEmail }: AdminSidebarProps) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Close drawer on route change
    useEffect(() => { setOpen(false) }, [pathname])

    // Lock body scroll when open
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    const links = [
        { href: '/admin', label: '📊 Overview' },
        { href: '/admin/orders', label: '📦 Orders' },
        { href: '/admin/users', label: '👥 Users' },
        { href: '/admin/subscriptions', label: '📅 Subscriptions' },
        { href: '/admin/deliveries', label: '🚚 Deliveries' },
        { href: '/admin/coupons', label: '🏷️ Coupons' },
        { href: '/admin/audit', label: '📋 Audit Logs' },
        { href: '/dashboard', label: '← Back to User', isBack: true },
    ]

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin'
        return pathname.startsWith(href)
    }

    const sidebar = (
        <>
            <div className="sidebar-user">
                <div className="name">🔑 Admin</div>
                <div className="email">{userEmail}</div>
            </div>
            <ul className="sidebar-menu">
                {links.map(l => (
                    <li key={l.href}>
                        <Link
                            href={l.href}
                            className={isActive(l.href) ? 'active' : ''}
                            style={l.isBack ? { opacity: 0.6 } : undefined}
                            onClick={() => setOpen(false)}
                        >
                            {l.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </>
    )

    return (
        <>
            {/* Mobile hamburger button — visible only below 1024px */}
            <button
                className="admin-sidebar-toggle"
                onClick={() => setOpen(true)}
                aria-label="Open admin menu"
            >
                ☰ <span>Menu</span>
            </button>

            {/* Desktop sidebar — hidden below 1024px via CSS */}
            <aside className="dashboard-sidebar dashboard-sidebar-desktop">
                {sidebar}
            </aside>

            {/* Mobile overlay + drawer — visible only below 1024px */}
            {open && (
                <div className="admin-sidebar-overlay" onClick={() => setOpen(false)} />
            )}
            <aside className={`dashboard-sidebar dashboard-sidebar-mobile ${open ? 'open' : ''}`}>
                <button className="admin-sidebar-close" onClick={() => setOpen(false)} aria-label="Close menu">✕</button>
                {sidebar}
            </aside>
        </>
    )
}
