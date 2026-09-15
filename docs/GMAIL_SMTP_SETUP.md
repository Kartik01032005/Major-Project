# Gmail SMTP Setup Guide for BloodLink

This guide details how to configure Gmail SMTP with Nodemailer to enable functional password-reset emails in BloodLink.

---

## Prerequisites

To send transactional emails (such as password reset links) via Gmail SMTP, you must use a **Google App Password**. Google does **not** allow using your standard Google password for third-party SMTP connections.

### Step 1: Enable 2-Step Verification
1. Navigate to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Under "How you sign in to Google", select **2-Step Verification**.
3. Follow the prompts to turn on 2-Step Verification if it is not already active.

### Step 2: Generate an App Password
1. Under [Google Account Security](https://myaccount.google.com/security), search for or select **App passwords** (or visit directly: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
2. Under "App name", enter a descriptive identifier such as `BloodLink`.
3. Click **Create**.
4. Google will generate a **16-character password** (e.g. `abcd efgh ijkl mnop`).
5. Copy this 16-character code (you can omit spaces).

---

## Step 3: Configure Environment Variables

Add the following environment variables to your backend `.env` file (`server/.env`).

> ⚠️ **Security Warning**:
> - Never commit `.env` files to Git.
> - Never place real passwords or secrets in `README.md`, PR descriptions, or source code.
> - Ensure `.env` is listed in your `.gitignore`.

```env
# Client Application URL (Used to construct the reset password link in emails)
CLIENT_URL=http://localhost:3000

# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-account@gmail.com
SMTP_PASS=your-16-character-app-password
MAIL_FROM=BloodLink <your-account@gmail.com>
```

### Configuration Options Reference

| Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `CLIENT_URL` | `http://localhost:3000` (Dev) / `https://your-domain.com` (Prod) | Base URL for reset password link |
| `SMTP_HOST` | `smtp.gmail.com` | Gmail SMTP server address |
| `SMTP_PORT` | `465` (SSL) or `587` (TLS) | Standard SMTP ports |
| `SMTP_SECURE` | `true` (for port 465) / `false` (for port 587) | Use SSL direct connection |
| `SMTP_USER` | `your-account@gmail.com` | Your Gmail address |
| `SMTP_PASS` | `your-16-char-app-password` | The 16-character App Password generated in Step 2 |
| `MAIL_FROM` | `BloodLink <your-account@gmail.com>` | Email "From" display header |

---

## Step 4: Verification and Testing

### Transporter Health Check
When starting the server with valid SMTP credentials configured, the email service verifies connectivity with `smtp.gmail.com`.

### Testing Password Reset Flow
1. Open BloodLink frontend (`http://localhost:3000/forgot-password`).
2. Enter your registered email address and click **Send reset link**.
3. Verify that the UI displays the generic confirmation:
   > "Check your inbox. If an account exists for this email, we have sent password reset instructions with your reset link."
4. Check your Gmail inbox (and Spam folder) for an email with subject:
   > `Reset your BloodLink password`
5. Click **Reset Password** in the email.
6. Enter a new password on `/reset-password?token=...` and submit.
7. Sign in using the new password.
