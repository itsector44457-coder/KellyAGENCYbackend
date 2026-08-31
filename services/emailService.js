import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// === Configuration ===
const gmailUser = (process.env.GMAIL_USER || 'radhaagency4@gmail.com').trim();
const rawPass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || 'jahkhqfynjvbuwqt';
const gmailPass = rawPass ? rawPass.replace(/\s+/g, '') : '';

// Cloud-compatible email providers (HTTPS Port 443 — never blocked by Render/Railway)
const brevoApiKey   = process.env.BREVO_API_KEY   ? process.env.BREVO_API_KEY.trim()   : null;
const resendApiKey  = process.env.RESEND_API_KEY  ? process.env.RESEND_API_KEY.trim()  : null;

// Nodemailer SMTP (works on local & VPS only — Render/Railway block SMTP ports)
const smtpTransporter = nodemailer.createTransport({
  pool: true,
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4,
  auth: { user: gmailUser, pass: gmailPass },
  connectionTimeout: 5000,
  socketTimeout: 8000,
  tls: { rejectUnauthorized: false }
});

/**
 * UNIVERSAL EMAIL DISPATCHER
 * Priority 1: Brevo REST API  (Free 300/day, no domain needed, HTTPS 443)
 * Priority 2: Resend REST API (Needs custom domain, HTTPS 443)
 * Priority 3: Nodemailer SMTP (Local/VPS only — blocked on Render/Railway)
 */
export async function sendUniversalEmail({ to, subject, htmlContent }) {
  const recipient = to ? to.trim() : gmailUser;

  // ── PRIORITY 1: Brevo REST API (Free, no custom domain needed) ───────────
  if (brevoApiKey) {
    try {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Radha Agency', email: gmailUser },
          to: [{ email: recipient }],
          subject,
          htmlContent
        })
      });
      const data = await brevoRes.json();
      if (brevoRes.ok) {
        console.log(`🚀 [Brevo API Sent] To: ${recipient} | MsgID: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      } else {
        console.warn('⚠️ [Brevo API Error]:', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('⚠️ [Brevo Network Error]:', e.message);
    }
  }

  // ── PRIORITY 2: Resend REST API (Needs verified custom domain) ───────────
  if (resendApiKey) {
    try {
      const fromAddress = process.env.RESEND_FROM_EMAIL
        ? `Radha Agency <${process.env.RESEND_FROM_EMAIL}>`
        : 'Radha Agency <onboarding@resend.dev>';
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ from: fromAddress, to: [recipient], subject, html: htmlContent })
      });
      const data = await resendRes.json();
      if (resendRes.ok) {
        console.log(`🚀 [Resend API Sent] To: ${recipient} | ID: ${data.id}`);
        return { success: true, messageId: data.id };
      } else {
        console.warn('⚠️ [Resend API Error]:', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('⚠️ [Resend Network Error]:', e.message);
    }
  }

  // ── PRIORITY 3: Nodemailer SMTP (Local/VPS fallback only) ────────────────
  try {
    const info = await smtpTransporter.sendMail({
      from: `"Radha Agency" <${gmailUser}>`,
      to: recipient,
      subject,
      html: htmlContent,
    });
    console.log(`🚀 [SMTP Sent] To: ${recipient} | MsgID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [All Email Methods Failed]: ${err.message}`);
    console.error(`   → Add BREVO_API_KEY env var on Render/Railway to fix this permanently.`);
    return { success: false, error: err.message };
  }
}

/**
 * Send HTML Email Notification to Radha Agency Member
 */
export async function sendMemberNotificationEmail({ to, subject, title, message, details, actionUrl }) {
  const recipient = to || 'radhaagency4@gmail.com';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Space Grotesk', system-ui, sans-serif; background-color: #1A1C11; color: #f1ece2; padding: 24px;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px;">
        <div style="font-size: 18px; font-weight: 900; color: #b7e44c; margin-bottom: 16px;">RADHA AGENCY • INTERNAL OS</div>
        <div style="font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 12px;">${title || 'System Notification'}</div>
        <p style="font-size: 14px; color: #d1cfc7; line-height: 1.6;">${message}</p>
        ${details ? `<div style="background-color: #1A1C11; border-radius: 10px; padding: 16px; margin: 16px 0; font-size: 13px;">${details}</div>` : ''}
        ${actionUrl ? `<div style="text-align: center; margin-top: 20px;"><a href="${actionUrl}" style="background-color: #b7e44c; color: #111; font-weight: 800; font-size: 12px; text-transform: uppercase; padding: 12px 24px; border-radius: 9999px; text-decoration: none;">View in Team OS →</a></div>` : ''}
        <div style="margin-top: 32px; font-size: 11px; color: #888680; text-align: center;">© ${new Date().getFullYear()} RADHA AGENCY. Confidential.</div>
      </div>
    </body>
    </html>
  `;
  return sendUniversalEmail({ to: recipient, subject: subject || `Notification: ${title}`, htmlContent });
}

/**
 * Send Client Project Acceptance Package & 3-Tier Proposal Email
 */
export async function sendClientProjectPortalEmail({ 
  to, 
  clientName, 
  projectTitle, 
  portalUrl, 
  clientLoginUrl, 
  clientPassword, 
  advancePercent, 
  advanceAmount,
  totalPrice,
  proposalData
}) {
  const recipient = to || 'client@example.com';
  const displayPrice = totalPrice ? `₹${Number(totalPrice).toLocaleString('en-IN')}` : '₹24,999';
  const displayAdvance = advanceAmount ? `₹${Number(advanceAmount).toLocaleString('en-IN')}` : '₹12,500';

  const packagesHtml = proposalData?.packages?.map((pkg) => `
    <div style="background-color: #1A1C11; border: 1px solid ${pkg.isRecommended ? '#b7e44c' : 'rgba(255,255,255,0.1)'}; border-radius: 12px; padding: 16px; margin-bottom: 12px; text-align: left;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-size: 14px; font-weight: 800; color: #fff; text-transform: uppercase;">${pkg.name}</span>
        <span style="font-size: 16px; font-weight: 900; color: #b7e44c; font-family: monospace;">${pkg.priceFormatted || '₹' + pkg.price}</span>
      </div>
      <div style="font-size: 12px; color: #888680; margin-bottom: 8px;">${pkg.subtitle}</div>
      ${pkg.isRecommended ? '<div style="display: inline-block; background-color: rgba(183, 228, 76, 0.2); color: #b7e44c; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 8px;">★ MOST RECOMMENDED</div>' : ''}
    </div>
  `).join('') || `
    <div style="background-color: #1A1C11; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; margin-bottom: 8px;">
      <strong style="color: #fff;">BASIC (₹7,000)</strong> - Starter catalogue / low-budget launch
    </div>
    <div style="background-color: #1A1C11; border: 1px solid #b7e44c; border-radius: 12px; padding: 14px; margin-bottom: 8px;">
      <strong style="color: #b7e44c;">SHOPIFY INTEGRATED (₹24,999)</strong> - [MOST RECOMMENDED] Complete e-commerce store
    </div>
    <div style="background-color: #1A1C11; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; margin-bottom: 8px;">
      <strong style="color: #fff;">FULLY CUSTOM (₹34,999)</strong> - Custom backend + admin panel + workflows
    </div>
  `;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #14160E; color: #f1ece2; padding: 24px; margin: 0;">
      <div style="max-width: 620px; margin: 0 auto; background-color: #1F2117; border: 2px solid #b7e44c; border-radius: 24px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        
        <!-- Header -->
        <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 24px;">
          <div style="font-size: 13px; font-weight: 900; letter-spacing: 2px; color: #b7e44c; text-transform: uppercase;">RADHA AGENCY • PROPOSAL PACKAGE</div>
          <div style="font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 6px;">${projectTitle}</div>
          <div style="font-size: 13px; color: #a1a1aa; margin-top: 4px;">Prepared for: <strong style="color: #ffffff;">${clientName}</strong></div>
        </div>

        <p style="font-size: 14px; color: #d4d4d8; line-height: 1.6;">
          Dear <strong>${clientName}</strong>,<br/>
          Thank you for choosing Radha Agency. Your tailored 3-Page Project Proposal, Comparison Matrix, and Official Scope are ready for your review and package selection.
        </p>

        <!-- Package Options Summary -->
        <div style="margin: 24px 0;">
          <div style="font-size: 11px; font-weight: 800; color: #b7e44c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Available Packages & Scope</div>
          ${packagesHtml}
        </div>

        <!-- Credentials Box -->
        <div style="background-color: #14160E; border: 1px solid rgba(183, 228, 76, 0.3); border-radius: 16px; padding: 20px; margin: 24px 0;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; margin-bottom: 10px; font-size: 13px;">
            <span style="color: #a1a1aa;">Client Portal Login:</span>
            <strong style="color: #ffffff; font-family: monospace;">${recipient}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; margin-bottom: 10px; font-size: 13px;">
            <span style="color: #a1a1aa;">Access Password:</span>
            <strong style="color: #b7e44c; font-family: monospace;">${clientPassword || 'RadhaClient#9821'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span style="color: #a1a1aa;">Initial Advance (${advancePercent || 50}%):</span>
            <strong style="color: #b7e44c; font-family: monospace; font-size: 15px;">${displayAdvance}</strong>
          </div>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0 20px;">
          <a href="${portalUrl || clientLoginUrl}" style="display: inline-block; background-color: #b7e44c; color: #111111; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding: 16px 36px; border-radius: 9999px; text-decoration: none; box-shadow: 0 10px 25px rgba(183, 228, 76, 0.3);">
            Open Interactive Client Portal →
          </a>
        </div>

        <div style="text-align: center; font-size: 11px; color: #71717a; margin-top: 24px;">
          You can select your desired package, view the comparison table, sign the agreement, and download the 3-page PDF directly on your portal.
        </div>

        <div style="margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; font-size: 11px; color: #71717a; text-align: center;">
          © ${new Date().getFullYear()} RADHA AGENCY DIGITAL MEDIA • Web Development & Growth Experts
        </div>
      </div>
    </body>
    </html>
  `;

  return sendUniversalEmail({ 
    to: recipient, 
    subject: `📋 Official Project Proposal & Packages: "${projectTitle}" - Radha Agency`, 
    htmlContent 
  });
}

/**
 * Send Payment Confirmation Receipt Email
 */
export async function sendPaymentApprovalConfirmationEmail({ to, clientName, projectTitle, utrNumber, advanceAmount, remainingAmount }) {
  const recipient = to || 'client@example.com';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Space Grotesk', system-ui, sans-serif; background-color: #1A1C11; color: #f1ece2; padding: 24px;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px;">
        <div style="font-size: 20px; font-weight: 900; color: #b7e44c; margin-bottom: 20px;">RADHA AGENCY • PAYMENT CONFIRMED</div>
        <div style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 12px;">✅ Advance Payment Received</div>
        <p style="font-size: 14px; color: #d1cfc7; line-height: 1.6;">Hello <strong>${clientName}</strong>, your advance payment for <strong>"${projectTitle}"</strong> has been approved by Finance. Project work has officially begun!</p>
        <div style="background-color: #1A1C11; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0;"><span>Amount Received:</span><strong style="color: #b7e44c; font-family: monospace;">₹${Number(advanceAmount).toLocaleString('en-IN')}</strong></div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0;"><span>Transaction UTR:</span><strong style="color: #fff; font-family: monospace;">${utrNumber || 'Verified'}</strong></div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0;"><span>Remaining Balance:</span><strong style="color: #fff; font-family: monospace;">₹${Number(remainingAmount || 0).toLocaleString('en-IN')}</strong></div>
        </div>
        <div style="margin-top: 32px; font-size: 11px; color: #888680; text-align: center;">© ${new Date().getFullYear()} RADHA AGENCY FINANCE DEPARTMENT.</div>
      </div>
    </body>
    </html>
  `;
  return sendUniversalEmail({ to: recipient, subject: `✅ Payment Confirmed: "${projectTitle}" (₹${Number(advanceAmount).toLocaleString('en-IN')})`, htmlContent });
}

/**
 * Send 6-Digit Email OTP for Agent Signup Verification
 */
export async function sendAgentSignupOtpEmail({ to, agentName, otp }) {
  const recipient = to || 'agent@example.com';
  const name = agentName || 'Partner Agent';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Space Grotesk', system-ui, sans-serif; background-color: #1A1C11; color: #f1ece2; padding: 24px;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px;">
        <div style="font-size: 20px; font-weight: 900; color: #b7e44c; margin-bottom: 20px;">RADHA AGENCY • PARTNER AFFILIATE</div>
        <div style="font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 12px;">🔐 Verify Your Agent Email</div>
        <p style="font-size: 14px; color: #d1cfc7; line-height: 1.6;">Hello <strong>${name}</strong>,<br/>Thank you for joining the Radha Agency Partner Program. Use the 6-digit verification code below to verify your email and activate your account.</p>
        <div style="background-color: #1A1C11; border: 2px dashed #b7e44c; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #b7e44c; font-family: monospace;">${otp}</div>
          <div style="font-size: 12px; color: #ff8a3d; margin-top: 8px; font-weight: 600;">⚠️ Code expires in 15 minutes.</div>
        </div>
        <div style="margin-top: 32px; font-size: 11px; color: #888680; text-align: center;">© ${new Date().getFullYear()} RADHA AGENCY PARTNER PROGRAM.</div>
      </div>
    </body>
    </html>
  `;
  return sendUniversalEmail({ to: recipient, subject: `[${otp}] Radha Agency Agent Verification Code`, htmlContent });
}

/**
 * Send Welcome Email to Agent with Referral Code
 */
export async function sendAgentWelcomeEmail({ to, agentName, referralCode, loginUrl }) {
  const recipient = to || 'agent@example.com';
  const portalUrl = loginUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agent/login`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Space Grotesk', system-ui, sans-serif; background-color: #1A1C11; color: #f1ece2; padding: 24px;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px;">
        <div style="font-size: 20px; font-weight: 900; color: #b7e44c; margin-bottom: 20px;">RADHA AGENCY • PARTNER AFFILIATE</div>
        <div style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 12px;">🎉 Welcome to Partner Network, ${agentName}!</div>
        <p style="font-size: 14px; color: #d1cfc7; line-height: 1.6;">Your Agent account is active and verified. Share your referral code or link with prospective clients to earn generous deal commissions!</p>
        <div style="background-color: #1A1C11; border: 1px solid rgba(183, 228, 76, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0;">
          <div style="font-size: 11px; text-transform: uppercase; color: #888680; font-weight: 700;">Your Unique Referral Code</div>
          <div style="font-size: 24px; font-weight: 800; color: #b7e44c; font-family: monospace;">${referralCode}</div>
        </div>
        <div style="text-align: center;"><a href="${portalUrl}" style="background-color: #b7e44c; color: #111; font-weight: 800; font-size: 13px; text-transform: uppercase; padding: 14px 28px; border-radius: 9999px; text-decoration: none;">Go to Agent Dashboard →</a></div>
        <div style="margin-top: 32px; font-size: 11px; color: #888680; text-align: center;">© ${new Date().getFullYear()} RADHA AGENCY DIGITAL MEDIA.</div>
      </div>
    </body>
    </html>
  `;
  return sendUniversalEmail({ to: recipient, subject: `🎉 Welcome to Radha Agency Partner Network! (Ref: ${referralCode})`, htmlContent });
}

/**
 * Send Notification when Commission is Unlocked & Credited
 */
export async function sendAgentCommissionCreditedEmail({ to, agentName, projectTitle, commissionAmount, newWalletBalance }) {
  const recipient = to || 'agent@example.com';
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agent/dashboard`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Space Grotesk', system-ui, sans-serif; background-color: #1A1C11; color: #f1ece2; padding: 24px;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px;">
        <div style="font-size: 20px; font-weight: 900; color: #b7e44c; margin-bottom: 20px;">RADHA AGENCY • COMMISSION EARNED</div>
        <div style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 12px;">💰 ₹${commissionAmount?.toLocaleString('en-IN')} Credited to Your Wallet!</div>
        <p style="font-size: 14px; color: #d1cfc7; line-height: 1.6;">Congratulations <strong>${agentName}</strong>! Your referred client for <strong>"${projectTitle}"</strong> has completed advance payment. Your commission is now unlocked!</p>
        <div style="background: linear-gradient(135deg, rgba(183, 228, 76, 0.15), rgba(36, 39, 27, 0.9)); border: 1px solid #b7e44c; border-radius: 16px; padding: 24px; margin: 20px 0; text-align: center;">
          <div style="font-size: 12px; text-transform: uppercase; color: #d1cfc7; font-weight: 700;">Commission Credited</div>
          <div style="font-size: 36px; font-weight: 900; color: #b7e44c; font-family: monospace;">+ ₹${commissionAmount?.toLocaleString('en-IN')}</div>
          <div style="font-size: 13px; color: #fff; margin-top: 10px;">Available Wallet: <strong>₹${newWalletBalance?.toLocaleString('en-IN')}</strong></div>
        </div>
        <div style="text-align: center;"><a href="${dashboardUrl}" style="background-color: #b7e44c; color: #111; font-weight: 800; font-size: 13px; text-transform: uppercase; padding: 14px 28px; border-radius: 9999px; text-decoration: none;">View Wallet & Request Payout →</a></div>
        <div style="margin-top: 32px; font-size: 11px; color: #888680; text-align: center;">© ${new Date().getFullYear()} RADHA AGENCY FINANCE DEPARTMENT.</div>
      </div>
    </body>
    </html>
  `;
  return sendUniversalEmail({ to: recipient, subject: `💰 Commission Unlocked: ₹${commissionAmount?.toLocaleString('en-IN')} for "${projectTitle}"`, htmlContent });
}

/**
 * Send Notification when Agent Withdrawal is APPROVED & PAID
 */
export async function sendAgentWithdrawalApprovedEmail({ to, agentName, amount, payoutMethod, utrNumber, remainingBalance }) {
  const recipient = to || 'agent@example.com';
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agent/dashboard`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Space Grotesk', system-ui, sans-serif; background-color: #1A1C11; color: #f1ece2; padding: 24px;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px;">
        <div style="font-size: 20px; font-weight: 900; color: #b7e44c; margin-bottom: 20px;">RADHA AGENCY • PAYOUT SUCCESS</div>
        <div style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 12px;">Payout Transferred: ₹${amount?.toLocaleString('en-IN')}</div>
        <p style="font-size: 14px; color: #d1cfc7; line-height: 1.6;">Hello <strong>${agentName}</strong>, your commission withdrawal has been approved and transferred successfully.</p>
        <div style="background-color: #1A1C11; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <div style="font-size: 36px; font-weight: 900; color: #b7e44c; font-family: monospace; text-align: center; margin: 10px 0;">₹${amount?.toLocaleString('en-IN')}</div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px;"><span>Payout Method:</span><strong style="color: #fff;">${payoutMethod || 'Bank / UPI Transfer'}</strong></div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px;"><span>Bank / UPI UTR:</span><strong style="color: #b7e44c; font-family: monospace;">${utrNumber || 'N/A'}</strong></div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px;"><span>Remaining Wallet:</span><strong style="color: #fff;">₹${remainingBalance?.toLocaleString('en-IN')}</strong></div>
        </div>
        <div style="text-align: center;"><a href="${dashboardUrl}" style="background-color: #b7e44c; color: #111; font-weight: 800; font-size: 13px; text-transform: uppercase; padding: 14px 28px; border-radius: 9999px; text-decoration: none;">View Dashboard Slip →</a></div>
        <div style="margin-top: 32px; font-size: 11px; color: #888680; text-align: center;">© ${new Date().getFullYear()} RADHA AGENCY FINANCE DEPARTMENT.</div>
      </div>
    </body>
    </html>
  `;
  return sendUniversalEmail({ to: recipient, subject: `✅ Payout Completed: ₹${amount?.toLocaleString('en-IN')} Transferred (UTR: ${utrNumber})`, htmlContent });
}

/**
 * Send Notification when Agent Withdrawal is REJECTED & REFUNDED
 */
export async function sendAgentWithdrawalRejectedEmail({ to, agentName, amount, reason, newWalletBalance }) {
  const recipient = to || 'agent@example.com';
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agent/dashboard`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Space Grotesk', system-ui, sans-serif; background-color: #1A1C11; color: #f1ece2; padding: 24px;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #24271B; border: 2px solid #ef4444; border-radius: 20px; padding: 32px;">
        <div style="font-size: 20px; font-weight: 900; color: #ef4444; margin-bottom: 20px;">RADHA AGENCY • PAYOUT UPDATE</div>
        <div style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 12px;">Withdrawal Request Update (₹${amount?.toLocaleString('en-IN')})</div>
        <div style="background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 14px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #fca5a5;">
          <strong>Reason Provided by Finance:</strong><br/>${reason || 'Invalid account/UPI details. Please verify your payout information in dashboard.'}
        </div>
        <div style="background-color: #1A1C11; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px;"><span>Action Taken:</span><strong style="color: #b7e44c;">100% Refunded to Wallet</strong></div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px;"><span>Updated Wallet Balance:</span><strong style="color: #b7e44c; font-size: 15px;">₹${newWalletBalance?.toLocaleString('en-IN')}</strong></div>
        </div>
        <div style="text-align: center;"><a href="${dashboardUrl}" style="background-color: #b7e44c; color: #111; font-weight: 800; font-size: 13px; text-transform: uppercase; padding: 14px 28px; border-radius: 9999px; text-decoration: none;">Update Payout Details & Retry →</a></div>
        <div style="margin-top: 32px; font-size: 11px; color: #888680; text-align: center;">© ${new Date().getFullYear()} RADHA AGENCY FINANCE DEPARTMENT.</div>
      </div>
    </body>
    </html>
  `;
  return sendUniversalEmail({ to: recipient, subject: `⚠️ Withdrawal Declined & Refunded to Wallet: ₹${amount?.toLocaleString('en-IN')} [Radha Agency]`, htmlContent });
}

/**
 * Send Password Reset OTP Email
 */
export async function sendPasswordResetOtpEmail({ to, name, otp, userType }) {
  const recipient = to || 'user@example.com';
  const roleTitle = userType === 'AGENT' ? 'Agent Partner Portal' : (userType === 'CLIENT' ? 'Client Project Portal' : 'Internal Team OS');
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Space Grotesk', system-ui, sans-serif; background-color: #1A1C11; color: #f1ece2; padding: 24px;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px;">
        <div style="font-size: 20px; font-weight: 900; color: #b7e44c; margin-bottom: 20px;">RADHA AGENCY • PASSWORD RESET</div>
        <div style="font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 12px;">🔐 Reset Your Password (${roleTitle})</div>
        <p style="font-size: 14px; color: #d1cfc7; line-height: 1.6;">Hello <strong>${name || 'User'}</strong>,<br/>Use the 6-digit verification code below to reset your password for your ${roleTitle} account.</p>
        <div style="background-color: #1A1C11; border: 1px solid rgba(183, 228, 76, 0.4); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #b7e44c; font-family: monospace;">${otp}</div>
          <div style="font-size: 11px; color: #ef4444; margin-top: 8px; font-weight: 600;">⚠️ Code expires in 15 minutes.</div>
        </div>
        <div style="margin-top: 32px; font-size: 11px; color: #888680; text-align: center;">© ${new Date().getFullYear()} RADHA AGENCY SECURITY.</div>
      </div>
    </body>
    </html>
  `;
  return sendUniversalEmail({ to: recipient, subject: `[${otp}] Password Reset Verification Code - Radha Agency`, htmlContent });
}
