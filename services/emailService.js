import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create 100% Pure Nodemailer Transporter for Gmail SMTP
const gmailUser = (process.env.GMAIL_USER || 'radhaagency4@gmail.com').trim();
const rawPass = process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || 'jahkhqfynjvbuwqt';
const gmailPass = rawPass ? rawPass.replace(/\s+/g, '') : '';

// Primary Nodemailer Gmail Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
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
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.warn('⚠️ [Nodemailer Service Warning]:', error.message);
  } else {
    console.log('✅ [Nodemailer Gmail Ready]: Connected as', gmailUser);
  }
});

// Pure Nodemailer send helper with automatic transport fallback
async function sendNodemailerEmail({ to, subject, htmlContent }) {
  const recipient = to ? to.trim() : gmailUser;

  // Try Primary Transporter (service: 'gmail')
  try {
    const info = await transporter.sendMail({
      from: `"Radha Agency" <${gmailUser}>`,
      to: recipient,
      subject,
      html: htmlContent,
    });
    console.log(`🚀 [Nodemailer Sent] To: ${recipient} | MsgID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err1) {
    console.warn(`⚠️ [Nodemailer Primary failed, retrying with Port 587 TLS...]: ${err1.message}`);
    
    // Fallback Transporter (smtp.gmail.com:587 TLS IPv4)
    try {
      const info2 = await fallbackTransporter.sendMail({
        from: `"Radha Agency" <${gmailUser}>`,
        to: recipient,
        subject,
        html: htmlContent,
      });
      console.log(`🚀 [Nodemailer Fallback Sent] To: ${recipient} | MsgID: ${info2.messageId}`);
      return { success: true, messageId: info2.messageId };
    } catch (err2) {
      console.error(`❌ [Nodemailer Error]: ${err2.message}`);
      return { success: false, error: err2.message };
    }
  }
}

/**
 * Send HTML Email Notification to Radha Agency Member via Gmail SMTP
 */
export async function sendMemberNotificationEmail({ to, subject, title, message, details, actionUrl }) {
  const recipient = to || 'radhaagency4@gmail.com';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif; background-color: #1A1C11; color: #f1ece2; margin: 0; padding: 24px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #24271B; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .brand { font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #b7e44c; text-transform: uppercase; margin-bottom: 24px; border-b: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; }
        .title { font-size: 22px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
        .message { font-size: 14px; line-height: 1.6; color: #d1cfc7; margin-bottom: 24px; }
        .details-box { background-color: #1A1C11; border-left: 4px solid #b7e44c; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; color: #e1dfd7; }
        .btn { display: inline-block; background-color: #b7e44c; color: #111111; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; padding: 12px 24px; border-radius: 9999px; text-decoration: none; }
        .footer { margin-top: 32px; font-size: 11px; color: #888680; border-t: 1px solid rgba(255,255,255,0.1); pt: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">RADHA AGENCY • TEAM OPERATING SYSTEM</div>
        <div class="title">${title || subject}</div>
        <div class="message">${message}</div>
        ${details ? `<div class="details-box">${details}</div>` : ''}
        ${actionUrl ? `<a href="${actionUrl}" class="btn">Open System Module</a>` : ''}
        <div class="footer">
          © ${new Date().getFullYear()} RADHA AGENCY. Official Team Notification System.
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`[Gmail Nodemailer Dispatching] To: ${recipient} | Subject: "${subject}"`);

  try {
    const info = await sendNodemailerEmail({ to: recipient, subject: `[Radha Agency Team OS] ${subject}`, htmlContent: htmlContent });
    console.log(`🚀 [Gmail Email Sent Successfully] MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Gmail Nodemailer Error]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Client Project Acceptance Package Portal Email
 */
export async function sendClientProjectPortalEmail({ to, clientName, projectTitle, portalUrl, clientLoginUrl, clientPassword, advancePercent, advanceAmount }) {
  const recipient = to || 'client@example.com';
  const loginUrl = clientLoginUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/client-login`;
  const percentText = advancePercent ? `${advancePercent}%` : '50%';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif; background-color: #1A1C11; color: #f1ece2; margin: 0; padding: 24px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .brand { font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #b7e44c; text-transform: uppercase; margin-bottom: 24px; border-b: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; }
        .title { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 16px; }
        .message { font-size: 14px; line-height: 1.6; color: #d1cfc7; margin-bottom: 24px; }
        .details-box { background-color: #1A1C11; border: 1px solid rgba(183, 228, 76, 0.3); padding: 20px; border-radius: 12px; margin-bottom: 24px; font-size: 13px; color: #e1dfd7; }
        .cred-box { background-color: #24271B; border: 1px border-dashed #b7e44c; padding: 14px; border-radius: 10px; margin-top: 12px; }
        .btn { display: inline-block; background-color: #b7e44c; color: #111111; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; padding: 14px 28px; border-radius: 12px; text-decoration: none; box-shadow: 0 10px 20px rgba(183,228,76,0.2); }
        .footer { margin-top: 32px; font-size: 11px; color: #888680; border-t: 1px solid rgba(255,255,255,0.1); pt: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">RADHA AGENCY • CLIENT ACCEPTANCE PACKAGE</div>
        <div class="title">Welcome, ${clientName}!</div>
        <div class="message">
          Your project proposal and service agreement package for <strong>"${projectTitle}"</strong> is ready for review and project confirmation.
        </div>
        <div class="details-box">
          <p style="margin: 0 0 8px 0;"><strong>📁 Project Deliverable:</strong> ${projectTitle}</p>
          <p style="margin: 0 0 8px 0;"><strong>💰 Advance Required (${percentText}):</strong> ₹${advanceAmount?.toLocaleString('en-IN') || '12,500'}</p>

          <div class="cred-box">
            <p style="margin: 0 0 6px 0; color: #b7e44c; font-weight: bold;">🔑 YOUR CLIENT PORTAL LOGIN CREDENTIALS:</p>
            <p style="margin: 0 0 4px 0;">• <strong>Client Login ID:</strong> <code>${recipient}</code></p>
            <p style="margin: 0 0 4px 0;">• <strong>Access Password:</strong> <span style="background: #b7e44c; color: #111; font-weight: bold; padding: 2px 8px; border-radius: 4px;">${clientPassword}</span></p>
            <p style="margin: 0;">• <strong>Client Login Portal Link:</strong> <a href="${loginUrl}" style="color: #b7e44c;">${loginUrl}</a></p>
          </div>

          <p style="margin: 12px 0 0 0;"><strong> Workflow:</strong> Review Proposal → Sign Agreement → Pay Advance via Bank/UPI QR → Track Live Project Progress & Financial Balance</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${portalUrl}" class="btn">View Proposal & Accept Project →</a>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} RADHA AGENCY DIGITAL MEDIA. Official Client Portal.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await sendNodemailerEmail({ to: recipient, subject: `📁 Proposal Package & Client Login: ${projectTitle} - Radha Agency`, htmlContent: htmlContent });
    console.log(`🚀 [Client Portal Email Sent] To: ${recipient} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [Nodemailer Client Portal Error]:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Payment Confirmation & Signed Documents Package Email
 */
export async function sendPaymentApprovalConfirmationEmail({ to, clientName, projectTitle, utrNumber, advanceAmount, remainingAmount }) {
  const recipient = to || 'client@example.com';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif; background-color: #1A1C11; color: #f1ece2; margin: 0; padding: 24px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #24271B; border: 2px solid #10b981; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .brand { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #10b981; text-transform: uppercase; margin-bottom: 24px; border-b: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; }
        .title { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 16px; }
        .message { font-size: 14px; line-height: 1.6; color: #d1cfc7; margin-bottom: 24px; }
        .details-box { background-color: #1A1C11; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; color: #e1dfd7; }
        .status-badge { display: inline-block; background-color: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; }
        .footer { margin-top: 32px; font-size: 11px; color: #888680; border-t: 1px solid rgba(255,255,255,0.1); pt: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">🎉 RADHA AGENCY • PROJECT CONFIRMED</div>
        <div class="title">Advance Payment Received & Project Started!</div>
        <div class="message">
          Dear <strong>${clientName}</strong>,<br><br>
          We are pleased to inform you that your advance payment of <strong>₹${advanceAmount?.toLocaleString('en-IN')}</strong> (UTR: <code>${utrNumber}</code>) for <strong>"${projectTitle}"</strong> has been verified and approved by Radha Agency Finance.
        </div>
        <div class="details-box">
          <p style="margin: 0 0 8px 0;"><span class="status-badge">✅ PROJECT STATUS: CONFIRMED & IN PROGRESS</span></p>
          <p style="margin: 0 0 8px 0;"><strong>📁 Project Deliverable:</strong> ${projectTitle}</p>
          <p style="margin: 0 0 8px 0;"><strong>💵 Advance Received:</strong> ₹${advanceAmount?.toLocaleString('en-IN')}</p>
          <p style="margin: 0 0 8px 0;"><strong>💳 Remaining Balance:</strong> ₹${remainingAmount?.toLocaleString('en-IN')} (Due upon final delivery)</p>
          <p style="margin: 0;"><strong>🧾 Attached Documents:</strong> Approved Proposal, Signed Contract Agreement & Payment Receipt Voucher.</p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} RADHA AGENCY. Production & Development Team.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await sendNodemailerEmail({ to: recipient, subject: `🎉 Project Confirmed: ${projectTitle} - Advance Payment Received & Signed Contract`, htmlContent: htmlContent });
    console.log(`🚀 [Payment Approval Email Sent] To: ${recipient} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [Nodemailer Payment Approval Error]:`, error.message);
    return { success: false, error: error.message };
  }
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
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif; background-color: #1A1C11; color: #f1ece2; margin: 0; padding: 24px; }
        .container { max-width: 580px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #b7e44c; text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; }
        .title { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .message { font-size: 14px; line-height: 1.6; color: #d1cfc7; margin-bottom: 24px; }
        .otp-box { background-color: #1A1C11; border: 2px dashed #b7e44c; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #b7e44c; font-family: monospace; }
        .expiry { font-size: 12px; color: #ff8a3d; margin-top: 8px; font-weight: 600; }
        .footer { margin-top: 32px; font-size: 11px; color: #888680; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">RADHA AGENCY • PARTNER AFFILIATE PORTAL</div>
        <div class="title">🔐 Verify Your Agent Email</div>
        <div class="message">
          Hello <strong>${name}</strong>,<br/><br/>
          Thank you for joining the <strong>Radha Agency Partner & Affiliate Program</strong>. Please use the 6-digit verification code below to verify your email and activate your Agent account.
        </div>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="expiry">⚠️ This code expires in 5 minutes. Do not share with anyone.</div>
        </div>
        <div class="message" style="font-size: 12px; color: #a19f96;">
          If you did not request this verification, please ignore this email.
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} RADHA AGENCY. Official Partner & Commission System.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await sendNodemailerEmail({ to: recipient, subject: `[${otp}] Radha Agency Agent Verification Code`, htmlContent: htmlContent });
    console.log(`🚀 [Agent OTP Sent] To: ${recipient} | MsgID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Agent OTP Email Error]:', error.message);
    return { success: false, error: error.message };
  }
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
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif; background-color: #1A1C11; color: #f1ece2; margin: 0; padding: 24px; }
        .container { max-width: 580px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #b7e44c; text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; }
        .title { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .card { background-color: #1A1C11; border: 1px solid rgba(183, 228, 76, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0; }
        .code-box { font-size: 24px; font-weight: 800; color: #b7e44c; font-family: monospace; letter-spacing: 2px; }
        .btn { display: inline-block; background-color: #b7e44c; color: #111111; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; padding: 14px 28px; border-radius: 9999px; text-decoration: none; margin-top: 16px; }
        .footer { margin-top: 32px; font-size: 11px; color: #888680; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">RADHA AGENCY • PARTNER AFFILIATE</div>
        <div class="title">🎉 Welcome to Radha Agency Partner Network, ${agentName}!</div>
        <p style="font-size: 14px; color: #d1cfc7; line-height: 1.6;">
          Your Agent account is active and verified. You are now eligible to earn <strong>10% commission</strong> on every client project closed through your referral!
        </p>
        <div class="card">
          <div style="font-size: 11px; text-transform: uppercase; color: #888680; font-weight: 700; margin-bottom: 6px;">Your Unique Referral Code</div>
          <div class="code-box">${referralCode}</div>
          <div style="font-size: 12px; color: #a19f96; margin-top: 8px;">Share your link or submit client leads directly from your dashboard to earn commissions.</div>
        </div>
        <div style="text-align: center;">
          <a href="${portalUrl}" class="btn">Go to Agent Dashboard →</a>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} RADHA AGENCY DIGITAL MEDIA.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendNodemailerEmail({ to: recipient, subject: `🎉 Welcome to Radha Agency Partner Network! (Ref: ${referralCode})`, htmlContent: htmlContent });
  } catch (err) {
    console.error('❌ [Welcome Email Error]:', err.message);
  }
}

/**
 * Send Notification when Commission is Unlocked & Credited to Agent Wallet
 */
export async function sendAgentCommissionCreditedEmail({ to, agentName, projectTitle, commissionAmount, newWalletBalance }) {
  const recipient = to || 'agent@example.com';
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agent/dashboard`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif; background-color: #1A1C11; color: #f1ece2; margin: 0; padding: 24px; }
        .container { max-width: 580px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #b7e44c; text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; }
        .title { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .wallet-card { background: linear-gradient(135deg, rgba(183, 228, 76, 0.15), rgba(36, 39, 27, 0.9)); border: 1px solid #b7e44c; border-radius: 16px; padding: 24px; margin: 20px 0; text-align: center; }
        .amount { font-size: 36px; font-weight: 900; color: #b7e44c; font-family: monospace; }
        .btn { display: inline-block; background-color: #b7e44c; color: #111111; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; padding: 14px 28px; border-radius: 9999px; text-decoration: none; margin-top: 16px; }
        .footer { margin-top: 32px; font-size: 11px; color: #888680; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">RADHA AGENCY • COMMISSION EARNED</div>
        <div class="title">💰 ₹${commissionAmount?.toLocaleString('en-IN')} Credited to Your Wallet!</div>
        <p style="font-size: 14px; color: #d1cfc7; line-height: 1.6;">
          Congratulations <strong>${agentName}</strong>!<br/>
          Your referred client for <strong>"${projectTitle}"</strong> has confirmed the project and completed advance payment. Your commission is now unlocked and available in your wallet!
        </p>
        <div class="wallet-card">
          <div style="font-size: 12px; text-transform: uppercase; color: #d1cfc7; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;">Commission Credited</div>
          <div class="amount">+ ₹${commissionAmount?.toLocaleString('en-IN')}</div>
          <div style="font-size: 13px; color: #ffffff; margin-top: 10px;">Available Wallet Balance: <strong>₹${newWalletBalance?.toLocaleString('en-IN')}</strong></div>
        </div>
        <div style="text-align: center;">
          <a href="${dashboardUrl}" class="btn">View Wallet & Request Payout →</a>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} RADHA AGENCY. Official Partner System.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendNodemailerEmail({ to: recipient, subject: `💰 Commission Unlocked: ₹${commissionAmount?.toLocaleString('en-IN')} credited for "${projectTitle}"`, htmlContent: htmlContent });
  } catch (err) {
    console.error('❌ [Commission Email Error]:', err.message);
  }
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
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif; background-color: #1A1C11; color: #f1ece2; margin: 0; padding: 24px; }
        .container { max-width: 580px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #b7e44c; text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; }
        .title { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .badge-paid { display: inline-block; background-color: rgba(183, 228, 76, 0.2); color: #b7e44c; border: 1px solid #b7e44c; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 9999px; margin-bottom: 16px; }
        .details-card { background-color: #1A1C11; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
        .row:last-child { border-bottom: none; }
        .amount-hero { font-size: 36px; font-weight: 900; color: #b7e44c; font-family: monospace; text-align: center; margin: 10px 0; }
        .btn { display: inline-block; background-color: #b7e44c; color: #111111; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; padding: 14px 28px; border-radius: 9999px; text-decoration: none; margin-top: 16px; }
        .footer { margin-top: 32px; font-size: 11px; color: #888680; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">RADHA AGENCY • PAYOUT SUCCESS</div>
        <div class="badge-paid">✓ Payout Completed & Transferred</div>
        <div class="title">Payout Transferred: ₹${amount?.toLocaleString('en-IN')}</div>
        <p style="font-size: 14px; color: #d1cfc7; line-height: 1.6;">
          Hello <strong>${agentName}</strong>,<br/>
          Your commission withdrawal request has been approved by Radha Agency Finance and funds have been transferred successfully.
        </p>

        <div class="details-card">
          <div class="amount-hero">₹${amount?.toLocaleString('en-IN')}</div>
          <div class="row">
            <span style="color: #888680;">Payout Method:</span>
            <strong style="color: #ffffff;">${payoutMethod || 'Bank / UPI Transfer'}</strong>
          </div>
          <div class="row">
            <span style="color: #888680;">Bank / UPI UTR / Ref No:</span>
            <strong style="color: #b7e44c; font-family: monospace;">${utrNumber || 'N/A'}</strong>
          </div>
          <div class="row">
            <span style="color: #888680;">Processed Time:</span>
            <span style="color: #ffffff;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
          </div>
          <div class="row">
            <span style="color: #888680;">Remaining Wallet Balance:</span>
            <strong style="color: #ffffff;">₹${remainingBalance?.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${dashboardUrl}" class="btn">View Agent Dashboard & Slip →</a>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} RADHA AGENCY FINANCE DEPARTMENT.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendNodemailerEmail({ to: recipient, subject: `✅ Payout Completed: ₹${amount?.toLocaleString('en-IN')} Transferred (UTR: ${utrNumber})`, htmlContent: htmlContent });
    console.log(`🚀 [Withdrawal Approved Email Sent] To: ${recipient} | UTR: ${utrNumber}`);
  } catch (err) {
    console.error('❌ [Withdrawal Approved Email Error]:', err.message);
  }
}

/**
 * Send Notification when Agent Withdrawal is REJECTED & REFUNDED to Wallet
 */
export async function sendAgentWithdrawalRejectedEmail({ to, agentName, amount, reason, newWalletBalance }) {
  const recipient = to || 'agent@example.com';
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/agent/dashboard`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif; background-color: #1A1C11; color: #f1ece2; margin: 0; padding: 24px; }
        .container { max-width: 580px; margin: 0 auto; background-color: #24271B; border: 2px solid #ef4444; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #ef4444; text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; }
        .title { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .badge-refunded { display: inline-block; background-color: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 9999px; margin-bottom: 16px; }
        .details-card { background-color: #1A1C11; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px; margin: 20px 0; }
        .reason-box { background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 14px; border-radius: 8px; margin: 16px 0; font-size: 13px; color: #fca5a5; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
        .row:last-child { border-bottom: none; }
        .btn { display: inline-block; background-color: #b7e44c; color: #111111; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; padding: 14px 28px; border-radius: 9999px; text-decoration: none; margin-top: 16px; }
        .footer { margin-top: 32px; font-size: 11px; color: #888680; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">RADHA AGENCY • PAYOUT UPDATE</div>
        <div class="badge-refunded">⚠️ Request Declined & Refunded to Wallet</div>
        <div class="title">Withdrawal Request Update (₹${amount?.toLocaleString('en-IN')})</div>
        <p style="font-size: 14px; color: #d1cfc7; line-height: 1.6;">
          Hello <strong>${agentName}</strong>,<br/>
          Your withdrawal request of <strong>₹${amount?.toLocaleString('en-IN')}</strong> could not be processed and has been declined by Radha Agency Finance.
        </p>

        <div class="reason-box">
          <strong>Reason Provided by Finance:</strong><br/>
          ${reason || 'Bank details/UPI mismatch. Please verify your payout information in dashboard.'}
        </div>

        <div class="details-card">
          <div class="row">
            <span style="color: #888680;">Requested Amount:</span>
            <strong style="color: #ffffff;">₹${amount?.toLocaleString('en-IN')}</strong>
          </div>
          <div class="row">
            <span style="color: #888680;">Action Taken:</span>
            <strong style="color: #b7e44c;">100% Refunded Back to Available Wallet</strong>
          </div>
          <div class="row">
            <span style="color: #888680;">Updated Available Wallet Balance:</span>
            <strong style="color: #b7e44c; font-size: 15px;">₹${newWalletBalance?.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <p style="font-size: 13px; color: #a19f96;">
          💡 <strong>What should you do?</strong> Please visit your Agent Dashboard, update your Bank Account or UPI ID details under "Payout Settings", and submit a new withdrawal request.
        </p>

        <div style="text-align: center;">
          <a href="${dashboardUrl}" class="btn">Update Payout Details & Retry →</a>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} RADHA AGENCY FINANCE DEPARTMENT.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendNodemailerEmail({ to: recipient, subject: `⚠️ Withdrawal Declined & Refunded to Wallet: ₹${amount?.toLocaleString('en-IN')} [Radha Agency]`, htmlContent: htmlContent });
    console.log(`🚀 [Withdrawal Rejected Email Sent] To: ${recipient} | Reason: ${reason}`);
  } catch (err) {
    console.error('❌ [Withdrawal Rejected Email Error]:', err.message);
  }
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
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif; background-color: #1A1C11; color: #f1ece2; margin: 0; padding: 24px; }
        .container { max-width: 540px; margin: 0 auto; background-color: #24271B; border: 2px solid #b7e44c; border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #b7e44c; text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; }
        .title { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .message { font-size: 14px; line-height: 1.6; color: #d1cfc7; margin-bottom: 20px; }
        .otp-box { background-color: #1A1C11; border: 1px solid rgba(183, 228, 76, 0.4); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #b7e44c; font-family: monospace; }
        .expiry { font-size: 11px; color: #ef4444; margin-top: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .footer { margin-top: 32px; font-size: 11px; color: #888680; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brand">RADHA AGENCY • PASSWORD RESET</div>
        <div class="title">🔐 Reset Your Password (${roleTitle})</div>
        <div class="message">
          Hello <strong>${name || 'User'}</strong>,<br/><br/>
          We received a request to reset your password for your <strong>${roleTitle}</strong> account on Radha Agency. Use the 6-digit verification code below to verify your identity and set a new password.
        </div>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="expiry">⚠️ This code expires in 10 minutes. Do not share with anyone.</div>
        </div>
        <div class="message" style="font-size: 12px; color: #a19f96;">
          If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} RADHA AGENCY DIGITAL MEDIA. Security Department.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await sendNodemailerEmail({ to: recipient, subject: `[${otp}] Password Reset Verification Code - Radha Agency`, htmlContent: htmlContent });
    console.log(`🚀 [Password Reset OTP Sent] To: ${recipient} (${userType}) | MsgID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [Password Reset OTP Error]:', error.message);
    return { success: false, error: error.message };
  }
}
