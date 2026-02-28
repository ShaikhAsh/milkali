import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function TermsPage() {
    return (
        <>
            <Header />
            <div className="page-banner">
                <h1>Terms &amp; Conditions</h1>
                <p>Please read these terms carefully before using our service</p>
            </div>
            <section className="section">
                <div className="container">
                    <div className="legal-content">
                        <p>Last updated: February 2026</p>
                        <h2>1. Acceptance of Terms</h2>
                        <p>By using Milkali (&quot;the Platform&quot;), operated by Dairy Delight Milk and Milk Pvt Ltd, you agree to these Terms of Service.</p>

                        <h2>2. Service Area</h2>
                        <p>Milkali currently delivers exclusively within Mumbai, Maharashtra. We validate delivery addresses against our serviceable PIN code database. Orders outside our service area will be declined.</p>

                        <h2>3. Account &amp; Authentication</h2>
                        <p>Accounts are created using email and password. You are responsible for maintaining the security of your credentials. One account per email address is permitted.</p>

                        <h2>4. Subscriptions</h2>
                        <ul>
                            <li>Subscriptions are prepaid through the wallet system</li>
                            <li>Daily cost is deducted from your wallet balance</li>
                            <li>Deliveries occur between 5:00 AM — 7:00 AM</li>
                            <li>You can pause, resume, skip, or cancel anytime from your dashboard</li>
                            <li>Skip requests must be placed before 8:00 PM the previous day</li>
                        </ul>

                        <h2>5. Wallet &amp; Payments</h2>
                        <ul>
                            <li>Minimum wallet recharge: ₹100</li>
                            <li>Wallet balance is non-transferable</li>
                            <li>Refund of unused wallet balance is subject to our Refund Policy</li>
                            <li>All payments are processed securely via Razorpay</li>
                        </ul>

                        <h2>6. Product Quality</h2>
                        <p>We guarantee FSSAI-compliant, lab-tested, unadulterated cow milk. If you receive a defective product, please report within 4 hours of delivery for replacement or wallet credit.</p>

                        <h2>7. Limitation of Liability</h2>
                        <p>Milkali is not liable for damages exceeding the value of your most recent order. We are not responsible for delays caused by force majeure events.</p>

                        <h2>8. Governing Law</h2>
                        <p>These terms are governed by the laws of India. Disputes are subject to exclusive jurisdiction of courts in Mumbai, Maharashtra.</p>

                        <h2>9. Contact</h2>
                        <p>For questions about these terms, email <a href="mailto:care@milkali.in">care@milkali.in</a>.</p>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    )
}
