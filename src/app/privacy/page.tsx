import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
    return (
        <>
            <Header />
            <div className="page-banner">
                <h1>Privacy Policy</h1>
                <p>Your privacy is important to us</p>
            </div>
            <section className="section">
                <div className="container">
                    <div className="legal-content">
                        <p>Last updated: February 2026</p>
                        <h2>1. Information We Collect</h2>
                        <p>When you use Milkali, we collect the following information:</p>
                        <ul>
                            <li><strong>Account Information:</strong> Name, email address, phone number, and delivery addresses.</li>
                            <li><strong>Payment Information:</strong> Wallet recharge and transaction data. Payment processing is handled by Razorpay — we do not store card numbers.</li>
                            <li><strong>Delivery Data:</strong> Address, PIN code, and delivery preferences to fulfill your subscription orders.</li>
                            <li><strong>Usage Data:</strong> How you interact with our platform for improvement purposes.</li>
                        </ul>

                        <h2>2. How We Use Your Information</h2>
                        <ul>
                            <li>Processing and fulfilling your orders and subscriptions</li>
                            <li>Managing your prepaid wallet balance</li>
                            <li>Communicating order updates, delivery changes, and wallet alerts</li>
                            <li>Providing customer support</li>
                            <li>Improving our platform and delivery operations</li>
                        </ul>

                        <h2>3. Data Sharing</h2>
                        <p>We do not sell your personal data. We share data only with:</p>
                        <ul>
                            <li>Our delivery partners for fulfilling orders</li>
                            <li>Payment processor (Razorpay) for wallet recharges</li>
                            <li>Legal authorities when required by Indian law</li>
                        </ul>

                        <h2>4. Data Security</h2>
                        <p>We implement industry-standard security measures including encryption, authentication, and secure HTTPS communication to protect your data.</p>

                        <h2>5. Your Rights</h2>
                        <p>You may request access, correction, or deletion of your personal data by contacting us at <a href="mailto:care@milkali.in">care@milkali.in</a>.</p>

                        <h2>6. Cookies</h2>
                        <p>We use essential cookies and local storage for authentication. We do not use third-party advertising cookies.</p>

                        <h2>7. Contact</h2>
                        <p>For privacy-related queries, contact us at <a href="mailto:care@milkali.in">care@milkali.in</a> or call +91 77100 48128.</p>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    )
}
