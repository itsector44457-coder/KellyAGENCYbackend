import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create Nodemailer Transporter using Gmail SMTP App Password
const gmailUser = process.env.GMAIL_USER || 'kellyagency4@gmail.com';
const gmailPass = process.env.GMAIL_PASS || 'jahkhqfynjvbuwqt';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ [Nodemailer Gmail SMTP Error]:', error.message);
  } else {
    console.log('✅ [Nodemailer Gmail SMTP Ready]: Connected as', gmailUser);
  }
});

/**
 * Send HTML Email Notification to Kelly Agency Member via Gmail SMTP
 */
export async function sendMemberNotificationEmail({ to, subject, title, message, details, actionUrl }) {
  const recipient = to || 'kellyagency4@gmail.com';

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
        <div class="brand">KELLY AGENCY • TEAM OPERATING SYSTEM</div>
        <div class="title">${title || subject}</div>
        <div class="message">${message}</div>
        ${details ? `<div class="details-box">${details}</div>` : ''}
        ${actionUrl ? `<a href="${actionUrl}" class="btn">Open System Module</a>` : ''}
        <div class="footer">
          © ${new Date().getFullYear()} KELLY AGENCY. Official Team Notification System.
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`[Gmail Nodemailer Dispatching] To: ${recipient} | Subject: "${subject}"`);

  try {
    const info = await transporter.sendMail({
      from: `"Kelly Agency OS" <${gmailUser}>`,
      to: recipient,
      subject: `[Kelly Agency Team OS] ${subject}`,
      html: htmlContent,
    });
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
        <div class="brand">KELLY AGENCY • CLIENT ACCEPTANCE PACKAGE</div>
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
          © ${new Date().getFullYear()} KELLY AGENCY DIGITAL MEDIA. Official Client Portal.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Kelly Agency Client Services" <${gmailUser}>`,
      to: recipient,
      subject: `📁 Proposal Package & Client Login: ${projectTitle} - Kelly Agency`,
      html: htmlContent,
    });
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
        <div class="brand">🎉 KELLY AGENCY • PROJECT CONFIRMED</div>
        <div class="title">Advance Payment Received & Project Started!</div>
        <div class="message">
          Dear <strong>${clientName}</strong>,<br><br>
          We are pleased to inform you that your advance payment of <strong>₹${advanceAmount?.toLocaleString('en-IN')}</strong> (UTR: <code>${utrNumber}</code>) for <strong>"${projectTitle}"</strong> has been verified and approved by Kelly Agency Finance.
        </div>
        <div class="details-box">
          <p style="margin: 0 0 8px 0;"><span class="status-badge">✅ PROJECT STATUS: CONFIRMED & IN PROGRESS</span></p>
          <p style="margin: 0 0 8px 0;"><strong>📁 Project Deliverable:</strong> ${projectTitle}</p>
          <p style="margin: 0 0 8px 0;"><strong>💵 Advance Received:</strong> ₹${advanceAmount?.toLocaleString('en-IN')}</p>
          <p style="margin: 0 0 8px 0;"><strong>💳 Remaining Balance:</strong> ₹${remainingAmount?.toLocaleString('en-IN')} (Due upon final delivery)</p>
          <p style="margin: 0;"><strong>🧾 Attached Documents:</strong> Approved Proposal, Signed Contract Agreement & Payment Receipt Voucher.</p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} KELLY AGENCY. Production & Development Team.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Kelly Agency Finance Team" <${gmailUser}>`,
      to: recipient,
      subject: `🎉 Project Confirmed: ${projectTitle} - Advance Payment Received & Signed Contract`,
      html: htmlContent,
    });
    console.log(`🚀 [Payment Approval Email Sent] To: ${recipient} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [Nodemailer Payment Approval Error]:`, error.message);
    return { success: false, error: error.message };
  }
}
