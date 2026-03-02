'use client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

// Placeholder blog posts — replace with CMS or MDX later
const posts = [
    {
        slug: 'what-is-milk',
        title: 'What is Milk? Benefits of Cow Milk Explained',
        excerpt:
            'Discover why milk from indigenous Indian cow breeds is easier to digest and more nutritious than regular milk. Learn the science behind beta-casein protein.',
        date: '2026-02-28',
        readTime: '5 min read',
        category: 'Health & Nutrition',
    },
    {
        slug: 'why-fresh-milk-beats-packaged',
        title: 'Why Farm-Fresh Milk Is Better Than Packaged Milk',
        excerpt:
            'Understand the key differences between farm-fresh cow milk and commercially packaged UHT milk. From nutrients to taste — here\'s what you need to know.',
        date: '2026-02-20',
        readTime: '4 min read',
        category: 'Milk Education',
    },
    {
        slug: 'milk-delivery-mumbai-guide',
        title: 'The Complete Guide to Milk Delivery Services in Mumbai',
        excerpt:
            'Looking for a reliable milk delivery in Mumbai? Compare subscription plans, pricing, and delivery schedules from Mumbai\'s top dairy brands.',
        date: '2026-02-15',
        readTime: '6 min read',
        category: 'Mumbai Guide',
    },
]

export default function BlogPage() {
    return (
        <>
            <Header />

            <div className="page-banner">
                <h1>Milkali Blog</h1>
                <p>Insights on cow milk, dairy nutrition, and healthy living</p>
            </div>

            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">Latest Articles</div>
                        <h2>Fresh From the Farm — And Our Blog</h2>
                        <p>
                            Expert tips, health insights, and everything you need to know about pure
                            cow milk in Mumbai.
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                            gap: '32px',
                            maxWidth: '1100px',
                            margin: '0 auto',
                        }}
                    >
                        {posts.map((post) => (
                            <article
                                key={post.slug}
                                className="card"
                                style={{
                                    padding: '0',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.3s var(--ease-out)',
                                    cursor: 'pointer',
                                }}
                            >
                                {/* Colored header bar */}
                                <div
                                    style={{
                                        height: '6px',
                                        background:
                                            'linear-gradient(90deg, var(--navy-800), var(--gold-500))',
                                    }}
                                />
                                <div style={{ padding: '28px' }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '12px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: 'var(--gold-700)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                            }}
                                        >
                                            {post.category}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '12px',
                                                color: 'var(--gray-400)',
                                            }}
                                        >
                                            {post.readTime}
                                        </span>
                                    </div>
                                    <h3
                                        style={{
                                            fontSize: '20px',
                                            marginBottom: '10px',
                                            lineHeight: 1.35,
                                        }}
                                    >
                                        {post.title}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: '14px',
                                            color: 'var(--gray-500)',
                                            lineHeight: 1.7,
                                            marginBottom: '16px',
                                        }}
                                    >
                                        {post.excerpt}
                                    </p>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span
                                            style={{ fontSize: '12px', color: 'var(--gray-400)' }}
                                        >
                                            {new Date(post.date).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </span>
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="btn btn-ghost btn-sm"
                                            style={{ padding: '8px 16px' }}
                                        >
                                            Read More →
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section section-cream">
                <div className="container">
                    <div className="cta-banner">
                        <h2>Try Milkali Today</h2>
                        <p>
                            Experience the real taste of pure cow milk. Start your
                            subscription and get farm-fresh milk delivered every morning.
                        </p>
                        <Link href="/subscriptions" className="btn btn-white btn-lg">
                            Subscribe Now
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    )
}