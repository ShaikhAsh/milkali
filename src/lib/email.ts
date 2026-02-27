// Email service — Resend integration
// All emails are sent for real using the Resend API.

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.EMAIL_FROM || "Milkali <onboarding@resend.dev>";

// ───── Shared email wrapper ─────────────────────────────────
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'Segoe UI','Inter',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:28px;font-weight:700;color:#002E5B;font-family:Georgia,'Times New Roman',serif;letter-spacing:1px;">
        Milkali
      </div>
      <div style="font-size:11px;color:#B58E3E;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">
        Premium Desi A2 Cow Milk
      </div>
    </div>

    <!-- Content Card -->
    <div style="background:#ffffff;border-radius:16px;padding:36px 32px;box-shadow:0 2px 12px rgba(0,46,91,0.06);border:1px solid #f0ede8;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:28px;font-size:11px;color:#999;line-height:1.6;">
      <div>© ${new Date().getFullYear()} Dairy Delight Milk and Milk Pvt Ltd</div>
      <div style="margin-top:4px;">Mumbai, Maharashtra · FSSAI Licensed</div>
      <div style="margin-top:8px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://milkali.com"}" style="color:#B58E3E;text-decoration:none;">milkali.com</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

// ───── Core send function ───────────────────────────────────
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const redirectEmail = process.env.DEV_EMAIL_REDIRECT;

    // If redirect is set → send ONLY to admin
    const finalTo = redirectEmail ? redirectEmail : options.to;

    const subjectPrefix = redirectEmail
      ? `[DEV REDIRECT for ${options.to}] `
      : "";

    const sendPayload: Record<string, string> = {
      from: FROM_EMAIL,
      to: finalTo,
      subject: subjectPrefix + options.subject,
      html: options.html,
    };
    if (options.replyTo) sendPayload.reply_to = options.replyTo;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await resend.emails.send(sendPayload as any);

    if (error) {
      console.error("❌ Resend API error:", error);
      return false;
    }

    console.log("✅ Email sent to", finalTo, "| id:", data?.id);
    return true;
  } catch (err) {
    console.error("❌ Email send failed:", err);
    return false;
  }
}



// ───── Welcome Email ────────────────────────────────────────
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  const html = emailWrapper(`
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🎉</div>
      <h2 style="color:#002E5B;margin:0 0 12px 0;font-size:24px;">Welcome to Milkali, ${name}!</h2>
      <p style="color:#666;font-size:15px;line-height:1.7;margin:0 0 20px 0;">
        You've joined Mumbai's premium desi cow milk family. We deliver farm-fresh A2 milk to your doorstep every morning — straight from village farms.
      </p>

      <div style="background:#F8F7F4;border-radius:12px;padding:20px;margin:0 0 24px 0;text-align:left;">
        <div style="font-size:13px;font-weight:700;color:#002E5B;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">What's Next?</div>
        <div style="margin-bottom:8px;"><span style="color:#B58E3E;font-weight:700;">1.</span> <span style="color:#444;font-size:14px;">Choose your plan (Daily / Alternate / Weekly)</span></div>
        <div style="margin-bottom:8px;"><span style="color:#B58E3E;font-weight:700;">2.</span> <span style="color:#444;font-size:14px;">Add your delivery address</span></div>
        <div><span style="color:#B58E3E;font-weight:700;">3.</span> <span style="color:#444;font-size:14px;">Recharge your wallet & start receiving fresh milk!</span></div>
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://milkali.com"}/subscriptions" 
         style="display:inline-block;background:#002E5B;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">
        Subscribe Now →
      </a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: "Welcome to Milkali! Farm-fresh milk awaits",
    html,
  });
}

// ───── Subscription Confirmation ────────────────────────────
export async function sendSubscriptionConfirmation(
  email: string,
  details: {
    name: string;
    variant: string;
    frequency: string;
    quantity: number;
    pricePerUnit: number;
    startDate: string;
    address: string;
  }
): Promise<boolean> {
  const dailyCost = (details.pricePerUnit * details.quantity).toFixed(0);

  const html = emailWrapper(`
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">✅</div>
      <h2 style="color:#002E5B;margin:0 0 8px 0;font-size:22px;">Subscription Confirmed!</h2>
      <p style="color:#666;font-size:14px;margin:0 0 24px 0;">Hi ${details.name}, your fresh milk subscription is now active.</p>
    </div>

    <div style="background:#F8F7F4;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#999;">Product</td><td style="padding:8px 0;text-align:right;color:#002E5B;font-weight:600;">${details.variant}</td></tr>
        <tr><td style="padding:8px 0;color:#999;">Frequency</td><td style="padding:8px 0;text-align:right;color:#002E5B;font-weight:600;">${details.frequency}</td></tr>
        <tr><td style="padding:8px 0;color:#999;">Quantity</td><td style="padding:8px 0;text-align:right;color:#002E5B;font-weight:600;">${details.quantity} pack(s)/day</td></tr>
        <tr><td style="padding:8px 0;color:#999;">Daily Cost</td><td style="padding:8px 0;text-align:right;color:#B58E3E;font-weight:700;font-size:16px;">₹${dailyCost}/day</td></tr>
        <tr style="border-top:1px solid #e8e5e0;"><td style="padding:12px 0 8px;color:#999;">Starts On</td><td style="padding:12px 0 8px;text-align:right;color:#002E5B;font-weight:600;">${details.startDate}</td></tr>
        <tr><td style="padding:8px 0;color:#999;">Delivery To</td><td style="padding:8px 0;text-align:right;color:#002E5B;font-weight:600;font-size:12px;">${details.address}</td></tr>
      </table>
    </div>

    <div style="text-align:center;">
      <p style="color:#666;font-size:13px;margin:0 0 16px 0;">Manage your subscription anytime from your dashboard.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://milkali.com"}/dashboard" 
         style="display:inline-block;background:#002E5B;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">
        View Dashboard →
      </a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: `Subscription Confirmed — ${details.variant} (${details.frequency})`,
    html,
  });
}

// ───── Wallet Recharge Confirmation ─────────────────────────
export async function sendWalletRechargeEmail(
  email: string,
  details: { name: string; amount: number; newBalance: number }
): Promise<boolean> {
  const html = emailWrapper(`
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">💰</div>
      <h2 style="color:#002E5B;margin:0 0 8px 0;font-size:22px;">Wallet Recharged!</h2>
      <p style="color:#666;font-size:14px;margin:0 0 24px 0;">Hi ${details.name}, your Milkali wallet has been topped up.</p>
    </div>

    <div style="background:linear-gradient(135deg,#F0F7FF 0%,#FFF9ED 100%);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:13px;color:#999;text-transform:uppercase;letter-spacing:1px;">Amount Added</div>
      <div style="font-size:36px;font-weight:800;color:#002E5B;margin:8px 0;">₹${details.amount}</div>
      <div style="font-size:14px;color:#666;">New Balance: <strong style="color:#B58E3E;">₹${details.newBalance.toFixed(2)}</strong></div>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://milkali.com"}/dashboard/wallet" 
         style="display:inline-block;background:#002E5B;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">
        View Wallet →
      </a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: `₹${details.amount} added to your Milkali wallet`,
    html,
  });
}

// ───── Low Balance Alert ────────────────────────────────────
export async function sendLowBalanceAlert(
  email: string,
  details: { name: string; balance: number; dailyCost: number }
): Promise<boolean> {
  const daysLeft = Math.floor(details.balance / details.dailyCost);

  const html = emailWrapper(`
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
      <h2 style="color:#E65100;margin:0 0 8px 0;font-size:22px;">Low Wallet Balance</h2>
      <p style="color:#666;font-size:14px;margin:0 0 24px 0;">Hi ${details.name}, your Milkali wallet is running low.</p>
    </div>

    <div style="background:#FFF3E0;border:1px solid #FFE0B2;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:13px;color:#E65100;text-transform:uppercase;letter-spacing:1px;">Current Balance</div>
      <div style="font-size:36px;font-weight:800;color:#E65100;margin:8px 0;">₹${details.balance.toFixed(2)}</div>
      <div style="font-size:14px;color:#666;">This covers approximately <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong> of delivery.</div>
    </div>

    <div style="text-align:center;">
      <p style="color:#666;font-size:13px;margin:0 0 16px 0;">Recharge now to avoid interruption in your daily milk delivery.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://milkali.com"}/dashboard/wallet" 
         style="display:inline-block;background:#E65100;color:#fff;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">
        Recharge Wallet →
      </a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: `⚠️ Low wallet balance — ₹${details.balance.toFixed(2)} remaining`,
    html,
  });
}

// ───── Order Confirmation ───────────────────────────────────
export async function sendOrderConfirmationEmail(
  email: string,
  details: {
    name: string;
    orderNumber: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
    deliveryDate: string;
    address?: string;
  }
): Promise<boolean> {
  const itemsHtml = details.items.map(i => `${i.name} × ${i.quantity} — ₹${i.price * i.quantity}`).join('<br/>');
  const html = emailWrapper(`
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">📦</div>
      <h2 style="color:#002E5B;margin:0 0 8px 0;font-size:22px;">Order Confirmed!</h2>
      <p style="color:#666;font-size:14px;margin:0 0 24px 0;">Hi ${details.name}, your order has been placed successfully.</p>
    </div>

    <div style="background:#F8F7F4;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#999;">Order #</td><td style="padding:8px 0;text-align:right;color:#002E5B;font-weight:700;">${details.orderNumber}</td></tr>
        <tr><td style="padding:8px 0;color:#999;">Items</td><td style="padding:8px 0;text-align:right;color:#002E5B;font-weight:600;font-size:13px;">${itemsHtml}</td></tr>
        <tr style="border-top:1px solid #e8e5e0;"><td style="padding:12px 0 8px;color:#999;">Total</td><td style="padding:12px 0 8px;text-align:right;color:#B58E3E;font-weight:700;font-size:18px;">₹${details.total}</td></tr>
        <tr><td style="padding:8px 0;color:#999;">Delivery</td><td style="padding:8px 0;text-align:right;color:#002E5B;font-weight:600;">${details.deliveryDate}</td></tr>
        <tr><td style="padding:8px 0;color:#999;">Address</td><td style="padding:8px 0;text-align:right;color:#002E5B;font-weight:600;font-size:12px;">${details.address}</td></tr>
      </table>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://milkali.com"}/dashboard" 
         style="display:inline-block;background:#002E5B;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">
        Track Order →
      </a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: `Order #${details.orderNumber} confirmed — Milkali 📦`,
    html,
  });
}

// ───── Subscription Paused/Cancelled Alert ──────────────────
export async function sendSubscriptionStatusEmail(
  email: string,
  details: { name: string; action: "paused" | "cancelled" | "resumed"; variant: string }
): Promise<boolean> {
  const icons = { paused: "⏸️", cancelled: "❌", resumed: "▶️" };
  const colors = { paused: "#F57C00", cancelled: "#D32F2F", resumed: "#2E7D32" };
  const messages = {
    paused: "Your subscription has been paused. You can resume anytime from your dashboard.",
    cancelled: "Your subscription has been cancelled. We'd love to have you back anytime!",
    resumed: "Your subscription is active again! Fresh milk deliveries will resume as scheduled.",
  };

  const html = emailWrapper(`
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">${icons[details.action]}</div>
      <h2 style="color:${colors[details.action]};margin:0 0 8px 0;font-size:22px;">
        Subscription ${details.action.charAt(0).toUpperCase() + details.action.slice(1)}
      </h2>
      <p style="color:#666;font-size:14px;margin:0 0 16px 0;">Hi ${details.name},</p>
      <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 8px 0;">${messages[details.action]}</p>
      <p style="color:#999;font-size:13px;margin:0 0 24px 0;">Product: <strong>${details.variant}</strong></p>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://milkali.com"}/dashboard" 
         style="display:inline-block;background:#002E5B;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">
        View Dashboard →
      </a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: `Subscription ${details.action} — ${details.variant}`,
    html,
  });
}

// ───── Contact Form: Support Notification ───────────────────
export async function sendContactNotification(details: {
  ticketNumber: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  type: string;
}): Promise<boolean> {
  const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.DEV_EMAIL_REDIRECT || 'hello@milkali.com';

  const html = emailWrapper(`
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;background:#002E5B;color:#fff;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:0.5px;">NEW SUPPORT TICKET #${details.ticketNumber}</div>
    </div>
    <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#999;width:100px;">From</td><td style="padding:8px 0;font-weight:600;">${details.name}</td></tr>
      <tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;">${details.email}</td></tr>
      ${details.phone ? `<tr><td style="padding:8px 0;color:#999;">Phone</td><td style="padding:8px 0;">${details.phone}</td></tr>` : ''}
      <tr><td style="padding:8px 0;color:#999;">Type</td><td style="padding:8px 0;">${details.type}</td></tr>
      ${details.subject ? `<tr><td style="padding:8px 0;color:#999;">Subject</td><td style="padding:8px 0;font-weight:600;">${details.subject}</td></tr>` : ''}
    </table>
    <div style="margin-top:16px;padding:16px;background:#F8F7F4;border-radius:8px;font-size:14px;line-height:1.7;color:#333;white-space:pre-wrap;">${details.message}</div>
    <div style="margin-top:20px;text-align:center;font-size:12px;color:#999;">Reply directly to this email to respond to the customer.</div>
  `);

  return sendEmail({
    to: SUPPORT_EMAIL,
    subject: `[Ticket #${details.ticketNumber}] ${details.subject || 'New Contact Message'} — ${details.name}`,
    html,
    replyTo: details.email,
  });
}

// ───── Contact Form: Auto-reply to Customer ─────────────────
export async function sendContactAutoReply(details: {
  name: string;
  email: string;
  ticketNumber: number;
}): Promise<boolean> {
  const html = emailWrapper(`
    <h2 style="font-size:22px;color:#002E5B;margin:0 0 8px;font-weight:700;">We've received your message! ✅</h2>
    <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 20px;">Hi ${details.name}, thank you for reaching out to Milkali Support.</p>
    <div style="background:#F8F7F4;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
      <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Your Ticket Number</div>
      <div style="font-size:28px;font-weight:700;color:#002E5B;">#${details.ticketNumber}</div>
    </div>
    <p style="font-size:14px;color:#666;line-height:1.7;">Our support team will review your message and get back to you <strong>within 24 hours</strong> (Mon—Sat, 8 AM—8 PM).</p>
    <p style="font-size:14px;color:#666;line-height:1.7;">If you need immediate help, contact us on WhatsApp: <a href="https://wa.me/919372236321" style="color:#25D366;font-weight:600;">+91 93722 36321</a></p>
    <p style="font-size:12px;color:#999;margin-top:24px;">Please keep this ticket number for your reference. You don't need to reply to this email.</p>
  `);

  return sendEmail({
    to: details.email,
    subject: `We received your message — Ticket #${details.ticketNumber} | Milkali Support`,
    html,
  });
}

// ───── Password Reset Email ─────────────────────────────────
export async function sendPasswordResetEmail(details: {
  email: string;
  name: string;
  resetLink: string;
}): Promise<boolean> {
  const html = emailWrapper(`
    <h2 style="font-size:22px;color:#002E5B;margin:0 0 8px;font-weight:700;">Reset Your Password</h2>
    <p style="font-size:14px;color:#666;line-height:1.7;margin:0 0 20px;">Hi ${details.name || 'there'}, we received a request to reset your Milkali account password.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${details.resetLink}" style="display:inline-block;background:#002E5B;color:#ffffff;font-size:16px;font-weight:600;padding:14px 40px;border-radius:10px;text-decoration:none;letter-spacing:0.5px;">Reset Password</a>
    </div>
    <div style="background:#FFF8F0;border-radius:10px;padding:16px;margin:20px 0;border-left:4px solid #B58E3E;">
      <p style="font-size:13px;color:#666;margin:0;line-height:1.6;">
        ⏰ This link expires in <strong>15 minutes</strong>.<br/>
        🔒 If you didn't request this, you can safely ignore this email — your password will remain unchanged.
      </p>
    </div>
    <p style="font-size:12px;color:#999;margin-top:24px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="font-size:12px;color:#B58E3E;word-break:break-all;">${details.resetLink}</p>
  `);

  return sendEmail({
    to: details.email,
    subject: 'Reset your password — Milkali',
    html,
  });
}
