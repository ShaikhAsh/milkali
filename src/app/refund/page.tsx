import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function RefundPage() {
    return (
        <>
            <Header />
            <div className="page-banner">
                <h1>Refund &amp; Cancellation Policy</h1>
                <p>Simple, transparent refund and cancellation terms</p>
            </div>
            <section className="section">
                <div className="container">
                    <div className="legal-content">
                        <p>Last updated: February 2026</p>
                        <h2>1. Subscription Cancellation</h2>
                        <ul>
                            <li>You can cancel your subscription anytime from your dashboard</li>
                            <li>There are zero cancellation fees</li>
                            <li>Cancellation takes effect from the next delivery cycle</li>
                            <li>Any scheduled deliveries for the current day remain unaffected</li>
                        </ul>

                        <h2>2. Wallet Refunds</h2>
                        <ul>
                            <li>Unused wallet balance is eligible for refund upon account closure</li>
                            <li>Refund requests must be made via email to hello@milkali.com</li>
                            <li>Refunds are processed within 7-10 business days</li>
                            <li>Refunds are credited to the original payment method</li>
                        </ul>

                        <h2>3. Product Quality Issues</h2>
                        <ul>
                            <li>If you receive milk that is spoiled or damaged, report within 4 hours of delivery</li>
                            <li>You will receive either a replacement delivery or wallet credit</li>
                            <li>Share a photo of the issue via WhatsApp or email for quick resolution</li>
                        </ul>

                        <h2>4. Delivery Issues</h2>
                        <ul>
                            <li>Missed deliveries are automatically credited back to your wallet</li>
                            <li>If delivery was attempted but you were unavailable, no refund is applicable</li>
                            <li>For incorrect deliveries, contact us immediately for resolution</li>
                        </ul>

                        <h2>5. Non-Refundable</h2>
                        <ul>
                            <li>Successfully delivered and consumed products</li>
                            <li>Issues reported after 4 hours of delivery</li>
                            <li>Promotional wallet credits or bonus amounts</li>
                        </ul>

                        <h2>6. Contact for Refunds</h2>
                        <p>Email <a href="mailto:hello@milkali.com">hello@milkali.com</a> or call +91 98765 43210 during 8 AM — 8 PM, Monday to Saturday.</p>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    )
}
