# Fix Email Delivery Issue

## Current Problem
SendGrid account has **exceeded its email credits/quota**. Both API and SMTP methods are failing with "Maximum credits exceeded" error.

## Quick Solutions

### Option 1: Use Mailtrap (Best for Development/Testing) ⭐

Mailtrap is a fake SMTP server that catches all emails - perfect for testing without using real email credits!

1. **Sign up at https://mailtrap.io** (free tier available)
2. **Create an inbox**
3. **Copy the SMTP credentials** from the inbox settings
4. **Update your `.env` file:**

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username-here
MAIL_PASSWORD=your-mailtrap-password-here
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@ebyapar.com
MAIL_FROM_NAME="Ebyapar.com"
```

5. **Clear config cache:**
```bash
php artisan config:clear
```

6. **Test it** - emails will appear in your Mailtrap inbox!

---

### Option 2: Use Gmail SMTP (For Real Emails)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Create an app password for "Mail"
   - Copy the 16-character password
3. **Update your `.env` file:**

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="Ebyapar.com"
```

4. **Clear config cache:**
```bash
php artisan config:clear
```

---

### Option 3: Upgrade SendGrid Account

If you want to continue using SendGrid:
1. Log into your SendGrid account
2. Upgrade to a paid plan, OR
3. Wait for the monthly quota to reset (if on free tier)

---

## For Now: Check Logs for Reset Code

Even without email working, the reset code is now **logged** in development mode. Check the logs:

**Windows PowerShell:**
```powershell
Get-Content storage/logs/laravel.log -Tail 50 | Select-String -Pattern "PASSWORD RESET CODE|Reset Code" -Context 3
```

The reset code will be displayed in the logs so you can test the functionality!

---

## After Fixing Email

1. **Test password reset:**
   - Go to `/forgot-password`
   - Enter your email
   - Check your email (or Mailtrap inbox)
   - You should receive the 6-digit code

2. **Verify the code works:**
   - Enter the code on the forgot password page
   - You should be redirected to the reset password form
   - Enter your new password
   - Login with the new password

---

## Recommended Setup

- **Development/Testing:** Use Mailtrap (free, catches all emails)
- **Production:** Use SendGrid (paid), Mailgun, or AWS SES

