import nodemailer from "nodemailer";

/**
 * Creates and returns a configured Nodemailer transporter
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback test transporter if no credentials provided
  return null;
}

export const emailService = {
  /**
   * Sends a styled password reset email to the specified user
   */
  sendPasswordResetEmail: async (
    toEmail: string,
    resetUrl: string,
    userName: string = "User"
  ): Promise<boolean> => {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || "BloodLink <noreply@bloodlink.in>";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your BloodLink Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #dc2626, #e11d48); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 14px; }
    .body { padding: 32px 28px; line-height: 1.6; }
    .button-wrap { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #dc2626; color: #ffffff !important; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 10px rgba(220, 38, 38, 0.25); }
    .note { background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #9f1239; margin: 20px 0; }
    .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 20px 24px; border-top: 1px solid #f1f5f9; background: #fafafa; }
    .alt-link { font-size: 12px; word-break: break-all; color: #64748b; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BloodLink</h1>
      <p>Smart Blood Donor Finder</p>
    </div>
    <div class="body">
      <h2>Hello ${userName},</h2>
      <p>We received a request to reset the password for your BloodLink account. Click the button below to set a new password:</p>
      
      <div class="button-wrap">
        <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
      </div>

      <div class="note">
        <strong>Important:</strong> This password reset link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
      </div>

      <div class="alt-link">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #dc2626;">${resetUrl}</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} BloodLink. Connecting donors & saving lives across India.
    </div>
  </div>
</body>
</html>
    `;

    try {
      const transporter = createTransporter();

      if (transporter) {
        await transporter.sendMail({
          from: fromAddress,
          to: toEmail,
          subject: "Reset your BloodLink password",
          html: htmlContent,
        });
        console.log(`📧 [BloodLink Email] Password reset email sent via SMTP to: ${toEmail}`);
      } else {
        // Development console fallback
        console.log("------------------------------------------------------------");
        console.log(`📧 [BloodLink Email Service] Password reset requested for: ${toEmail}`);
        console.log(`👉 Password Reset Link: ${resetUrl}`);
        console.log("------------------------------------------------------------");
      }

      return true;
    } catch (error: any) {
      console.error("❌ Failed to send password reset email:", error);
      // Still log the link for emergency development access
      console.log(`👉 [Fallback Reset Link]: ${resetUrl}`);
      return false;
    }
  },
};

export default emailService;
