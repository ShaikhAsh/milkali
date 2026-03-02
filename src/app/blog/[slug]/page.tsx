'use client'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Placeholder blog content — replace with CMS/MDX later
const blogPosts: Record<string, { title: string; date: string; readTime: string; category: string; content: string }> = {
    'what-is-milk': {
        title: 'What is Cow Milk? Benefits of Cow Milk Explained',
        date: '2026-02-28',
        readTime: '5 min read',
        category: 'Health & Nutrition',
        content: `
Cow milk comes from indigenous Indian cow breeds like Gir, Sahiwal, and Red Sindhi that naturally produce milk containing beta-casein protein.

## Why Cow Milk is Different

Regular milk from crossbred or HF cows contains different types of beta-casein proteins. Research suggests that certain protein types can cause digestive discomfort in many people, while cow milk protein is often easier to digest.

## Health Benefits of Cow Milk

- **Easier Digestion**: Cow milk protein breaks down differently in the gut, reducing bloating and discomfort
- **Rich in Nutrients**: Higher levels of Omega-3 fatty acids compared to regular milk
- **Natural Goodness**: From cows raised on organic fodder without artificial hormones
- **Better for Children**: Gentler on developing digestive systems

## How Milkali Sources Cow Milk

At Milkali, we work directly with village farms that raise indigenous Indian cow breeds. Every batch is lab-tested to verify protein composition, fat content, and purity.

Our milk is delivered within hours of milking — maintaining the cold chain from farm to your Mumbai doorstep. No processing plants, no middlemen, just pure cow milk.

---

*Ready to taste the difference? [Subscribe to Milkali](/subscriptions) and get farm-fresh cow milk delivered every morning in Mumbai.*
    `.trim(),
    },
    'why-fresh-milk-beats-packaged': {
        title: 'Why Farm-Fresh Milk Is Better Than Packaged Milk',
        date: '2026-02-20',
        readTime: '4 min read',
        category: 'Milk Education',
        content: `
Most packaged milk undergoes UHT (Ultra High Temperature) treatment, which extends shelf life but destroys beneficial enzymes and alters taste.

## The Problem with Packaged Milk

- **Over-processed**: UHT treatment heats milk to 135°C, destroying natural enzymes
- **Long supply chain**: Milk can be 3-7 days old by the time it reaches you
- **Unknown source**: Mixed from multiple farms with no traceability

## The Farm-Fresh Advantage

Farm-fresh milk from Milkali is:

- Delivered within hours of milking
- Maintained at 4°C throughout the cold chain
- Single-origin — traceable to specific village farms
- Lab-tested daily for purity and quality

---

*Experience the real taste of fresh milk. [Start your Milkali subscription today](/subscriptions).*
    `.trim(),
    },
    'milk-delivery-mumbai-guide': {
        title: 'The Complete Guide to Milk Delivery Services in Mumbai',
        date: '2026-02-15',
        readTime: '6 min read',
        category: 'Mumbai Guide',
        content: `
Finding reliable milk delivery in Mumbai can be challenging. Here's everything you need to know about getting fresh, quality milk delivered daily.

## What to Look for in a Milk Delivery Service

1. **Source Transparency**: Know where your milk comes from
2. **Freshness**: Same-day delivery from farm to doorstep
3. **Lab Testing**: Regular quality checks with available reports
4. **Flexible Subscriptions**: Ability to pause, skip, or modify deliveries
5. **Pricing**: Competitive rates without hidden charges

## Areas Served in Mumbai

Milkali delivers across all Mumbai PIN codes (400001 to 400100), covering:

- **South Mumbai**: Colaba, Fort, Marine Lines, Girgaon
- **Western Suburbs**: Bandra, Andheri, Juhu, Goregaon, Malad
- **Central Mumbai**: Dadar, Parel, Worli, Lower Parel
- **Eastern Suburbs**: Chembur, Ghatkopar, Mulund, Powai

## Delivery Schedule

Milkali delivers between 5:00 AM and 7:00 AM, 365 days a year.

---

*Check if we deliver to your area. [Visit milkali.in](/subscriptions) and enter your pincode.*
    `.trim(),
    },
}

export default function BlogPostPage() {
    const params = useParams()
    const slug = params?.slug as string
    const post = blogPosts[slug]

    if (!post) {
        return (
            <>
                <Header />
                <div className="page-banner">
                    <h1>Post Not Found</h1>
                    <p>The article you&apos;re looking for doesn&apos;t exist.</p>
                </div>
                <section className="section" style={{ textAlign: 'center' }}>
                    <Link href="/blog" className="btn btn-primary">← Back to Blog</Link>
                </section>
                <Footer />
            </>
        )
    }

    return (
        <>
            <Header />

            <div className="page-banner">
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold-300)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                    {post.category}
                </div>
                <h1 style={{ fontSize: '36px', maxWidth: '700px', margin: '0 auto' }}>{post.title}</h1>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                    <span>{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>·</span>
                    <span>{post.readTime}</span>
                </div>
            </div>

            <section className="section">
                <div className="container">
                    <article
                        style={{
                            maxWidth: '720px',
                            margin: '0 auto',
                            fontSize: '16px',
                            lineHeight: 1.85,
                            color: 'var(--gray-700)',
                        }}
                    >
                        {post.content.split('\n\n').map((block, i) => {
                            if (block.startsWith('## ')) {
                                return <h2 key={i} style={{ fontSize: '28px', marginTop: '40px', marginBottom: '16px', color: 'var(--navy-800)' }}>{block.replace('## ', '')}</h2>
                            }
                            if (block.startsWith('- ')) {
                                return (
                                    <ul key={i} style={{ margin: '16px 0', paddingLeft: '24px', listStyle: 'disc' }}>
                                        {block.split('\n').map((item, j) => (
                                            <li key={j} style={{ marginBottom: '8px' }}>{item.replace(/^- \*\*(.*?)\*\*:/, '<strong>$1</strong>:').replace(/^- /, '')}</li>
                                        ))}
                                    </ul>
                                )
                            }
                            if (block.startsWith('1. ')) {
                                return (
                                    <ol key={i} style={{ margin: '16px 0', paddingLeft: '24px' }}>
                                        {block.split('\n').map((item, j) => (
                                            <li key={j} style={{ marginBottom: '8px' }}>{item.replace(/^\d+\.\s*\*\*(.*?)\*\*:/, '<strong>$1</strong>:').replace(/^\d+\.\s*/, '')}</li>
                                        ))}
                                    </ol>
                                )
                            }
                            if (block === '---') {
                                return <hr key={i} style={{ margin: '40px 0', border: 'none', borderTop: '1px solid var(--gray-200)' }} />
                            }
                            if (block.startsWith('*') && block.endsWith('*')) {
                                return <p key={i} style={{ fontStyle: 'italic', color: 'var(--gray-500)', marginTop: '24px' }}>{block.replace(/^\*|\*$/g, '')}</p>
                            }
                            return <p key={i} style={{ marginBottom: '16px' }}>{block}</p>
                        })}
                    </article>

                    <div style={{ maxWidth: '720px', margin: '48px auto 0', textAlign: 'center' }}>
                        <Link href="/blog" className="btn btn-ghost">← Back to Blog</Link>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    )
}