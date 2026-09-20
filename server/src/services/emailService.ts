import nodemailer, { Transporter } from "nodemailer";

/**
 * Creates and returns a configured Nodemailer transporter using Gmail SMTP or custom SMTP settings.
 */
export function createTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE !== undefined 
    ? process.env.SMTP_SECURE === "true" 
    : port === 465;
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "").trim();

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return null;
}

/**
 * Verifies the SMTP transporter connection without logging sensitive credentials.
 */
export async function verifyTransporter(): Promise<boolean> {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "").trim();

  if (user && !pass) {
    console.warn(`⚠️ [Email Service] Gmail sender configured (${user}), but SMTP_PASS (Google App Password) is empty in server/.env. Add the 16-character Google App Password to enable live email delivery.`);
    return false;
  }

  if (!user || !pass) {
    console.warn("⚠️ [Email Service] SMTP credentials not configured: SMTP_USER or SMTP_PASS missing in server/.env. Password reset emails will NOT be dispatched to real inboxes until added.");
    return false;
  }

  const transporter = createTransporter();
  if (!transporter) {
    return false;
  }

  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await transporter.verify();
      console.log("✅ [Email Service] Gmail SMTP connection established and verified successfully.");
      return true;
    } catch (error: any) {
      if (attempt < maxAttempts && (error.message?.includes("Connection closed") || error.code === "ECONNECTION")) {
        await new Promise((res) => setTimeout(res, 1500));
        continue;
      }
      console.error("❌ [Email Service] SMTP connection verification failed:", error.message || "Unknown error");
      return false;
    }
  }

  return false;
}

export const emailService = {
  /**
   * Sends a professional password reset email to the specified user
   *
   * @param toEmail The recipient's email address
   * @param resetUrl The full URL containing the secure one-time reset token
   * @param userName The recipient's display name
   * @returns boolean indicating whether the email was handled/dispatched
   */
  sendPasswordResetEmail: async (
    toEmail: string,
    resetUrl: string,
    userName: string = "User"
  ): Promise<boolean> => {
    const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim();
    const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "").trim();
    const configuredFrom = (process.env.MAIL_FROM || process.env.EMAIL_FROM || "").trim();
    const defaultFrom = user ? `BloodLink <${user}>` : "BloodLink <noreply@bloodlink.dev>";
    const fromAddress = configuredFrom && !configuredFrom.includes("< >") && !configuredFrom.includes("<>")
      ? configuredFrom
      : defaultFrom;

    const subject = "Reset your BloodLink password";

    const textContent = `Hello ${userName},

We received a request to reset your BloodLink account password.

Click the link below or copy and paste it into your browser to create a new password:
${resetUrl}

This link expires in 30 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
BloodLink Team
Connecting donors & saving lives across India.`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your BloodLink password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; opacity: 0.92; font-size: 14px; }
    .body { padding: 36px 32px; line-height: 1.6; color: #334155; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .instructions { font-size: 15px; margin-bottom: 24px; color: #475569; }
    .button-wrap { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
    .notice { background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 14px 16px; border-radius: 8px; font-size: 13.5px; color: #9f1239; margin: 24px 0; }
    .fallback { font-size: 12.5px; color: #64748b; line-height: 1.5; word-break: break-all; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 24px; border-top: 1px solid #f1f5f9; background: #fafafa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BloodLink</h1>
      <p>Smart Blood Donor Finder</p>
    </div>
    <div class="body">
      <h2 class="greeting">Hello ${userName},</h2>
      <p class="instructions">We received a request to reset your BloodLink account password. Click the button below to create a new password:</p>
      
      <div class="button-wrap">
        <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
      </div>

      <div class="notice">
        <strong>Important:</strong> This link expires in <strong>30 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
      </div>

      <div class="fallback">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #dc2626;">${resetUrl}</a>
      </div>
    </div>
    <div class="footer">
      Regards,<br>
      <strong>BloodLink Team</strong><br>
      &copy; ${new Date().getFullYear()} BloodLink. Connecting donors & saving lives across India.
    </div>
  </div>
</body>
</html>`;

    try {
      const transporter = createTransporter();

      if (transporter) {
        await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject,
          text: textContent,
          html: htmlContent,
        });
        console.log(`📧 [BloodLink Email] Password reset email sent via SMTP successfully to recipient.`);
      } else if (user && !pass) {
        console.warn(`⚠️ [BloodLink Email] Password reset email not sent: sender (${user}) is configured, but SMTP_PASS (Google App Password) is empty in server/.env.`);
      } else {
        console.warn(`⚠️ [BloodLink Email] Password reset requested for recipient, but email could not be delivered because SMTP credentials (SMTP_USER / SMTP_PASS) are not set in server/.env.`);
      }

      return true;
    } catch (error: any) {
      console.error("❌ [BloodLink Email] Error sending password reset email:", error.message || "Failed to dispatch email");
      return false;
    }
  },
  verifyTransporter,
};

export default emailService;
