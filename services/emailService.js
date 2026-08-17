import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const gmailUser = (process.env.GMAIL_USER || 'radhaagency4@gmail.com').trim();
const rawPass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || 'jahkhqfynjvbuwqt';
const gmailPass = rawPass ? rawPass.replace(/\s+/g, '') : '';
const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : null;
const brevoApiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;

// Primary SSL Transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4, // Force IPv4
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
  connectionTimeout: 4000, // Quick 4s timeout - never hang the server for 30s!
  greetingTimeout: 4000,
  socketTimeout: 6000,
  tls: {
    rejectUnauthorized: false
  }
});

// Fallback Port 587 TLS Transporter
const fallbackTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  family: 4,
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
  connectionTimeout: 4000,
  greetingTimeout: 4000,
  socketTimeout: 6000,
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Universal Ultra-Fast Email Dispatcher
 * 1. Checks HTTPS REST APIs (Resend / Brevo) - Port 443 (Never blocked by Render cloud firewalls)
 * 2. Tries Nodemailer Direct SSL 465
 * 3. Tries Nodemailer Port 587 TLS
 */
export async function sendUniversalEmail({ to, subject, htmlContent }) {
  const recipient = to ? to.trim() : gmailUser;

  // 1. Resend API (HTTPS Port 443)
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Radha Agency <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
          to: [recipient],
          subject,
          html: htmlContent
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`🚀 [Resend HTTPS Sent] To: ${recipient} | ID: ${data.id}`);
        return { success: true, messageId: data.id };
      }
    } catch (e) {
      console.warn('⚠️ [Resend API failed]:', e.message);
    }
  }

  // 2. Brevo API (HTTPS Port 443)
  if (brevoApiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Radha Agency', email: gmailUser },
          to: [{ email: recipient }],
          subject,
          htmlContent
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`🚀 [Brevo HTTPS Sent] To: ${recipient} | ID: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      }
    } catch (e) {
      console.warn('⚠️ [Brevo API failed]:', e.message);
    }
  }

  // 3. Primary Nodemailer SSL 465
  try {
    const info = await transporter.sendMail({
      from: `"Radha Agency" <${gmailUser}>`,
      to: recipient,
      subject,
      html: htmlContent,
    });
    console.log(`🚀 [Nodemailer Port 465 Sent] To: ${recipient} | MsgID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err1) {
    console.warn(`⚠️ [Nodemailer 465 Timeout/Blocked]: ${err1.message}. Retrying on Port 587...`);

    // 4. Fallback Nodemailer TLS 587
    try {
      const info2 = await fallbackTransporter.sendMail({
        from: `"Radha Agency" <${gmailUser}>`,
        to: recipient,
        subject,
        html: htmlContent,
      });
      console.log(`🚀 [Nodemailer Port 587 Sent] To: ${recipient} | MsgID: ${info2.messageId}`);
      return { success: true, messageId: info2.messageId };
    } catch (err2) {
      console.error(`❌ [SMTP Cloud Firewall Blocked]: ${err2.message}`);
      return { success: false, error: err2.message };
    }
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
 * Send Client Project Acceptance Package Email
 */
export async function sendClientProjectPortalEmail({ to, clientName, projectTitle, portalUrl, clientLoginUrl, clientPassword, advancePercent, advanceAmount }) {
  const recipient = to || 'client@example.com';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Space Grotesk', system-ui, sans-serif; background-color: #1A1C11; color: #f1ece2; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px;">
        <div style="font-size: 20px; font-weight: 900; color: #b7e44c; margin-bottom: 20px;">RADHA AGENCY • PROJECT ACCEPTANCE</div>
        <div style="font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 12px;">Official Project Scope & Agreement</div>
        <p style="font-size: 14px; color: #d1cfc7; line-height: 1.6;">Dear <strong>${clientName}</strong>, your project package for <strong>"${projectTitle}"</strong> is ready for review.</p>
        <div style="background-color: #1A1C11; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <div style="font-size: 11px; text-transform: uppercase; color: #888680; font-weight: 700;">Client Login ID</div>
          <div style="font-size: 14px; color: #fff; font-family: monospace;">${recipient}</div>
          <div style="font-size: 11px; text-transform: uppercase; color: #888680; font-weight: 700; margin-top: 12px;">Access Password</div>
          <div style="font-size: 14px; color: #b7e44c; font-family: monospace; font-weight: 700;">${clientPassword || 'Contact Radha Agency'}</div>
          ${advanceAmount ? `<div style="font-size: 11px; text-transform: uppercase; color: #888680; font-weight: 700; margin-top: 12px;">Required Advance (${advancePercent || 50}%)</div><div style="font-size: 18px; color: #b7e44c; font-family: monospace; font-weight: 900;">₹${Number(advanceAmount).toLocaleString('en-IN')}</div>` : ''}
        </div>
        <div style="text-align: center;"><a href="${portalUrl || clientLoginUrl}" style="background-color: #b7e44c; color: #111; font-weight: 800; font-size: 13px; text-transform: uppercase; padding: 14px 28px; border-radius: 9999px; text-decoration: none;">Review Proposal & Pay Advance →</a></div>
        <div style="margin-top: 32px; font-size: 11px; color: #888680; text-align: center;">© ${new Date().getFullYear()} RADHA AGENCY DIGITAL MEDIA.</div>
      </div>
    </body>
    </html>
  `;
  return sendUniversalEmail({ to: recipient, subject: `📋 Project Acceptance Package: "${projectTitle}" - Radha Agency`, htmlContent });
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
