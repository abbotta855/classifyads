# Quick Email Setup for OTP System

## The Problem
OTP codes are being **generated correctly**, but emails are not being **sent** because the mail driver is set to `log` (which only logs emails to files).

## Quick Fix Options

### ✅ Option 1: Mailtrap (Easiest - Free for Testing)

1. Go to https://mailtrap.io and sign up (free)
2. Create an inbox
3. Copy the SMTP credentials
4. Update your `.env` file:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your-mailtrap-username-here
MAIL_PASSWORD=your-mailtrap-password-here
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"
```

5. Clear config cache:
```bash
php artisan config:clear
```

6. Test registration - emails will appear in your Mailtrap inbox!

---

### ✅ Option 2: Gmail SMTP (For Real Emails)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update your `.env` file:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

4. Clear config cache:
```bash
php artisan config:clear
```

---

### 📋 For Now: Check Logs to Verify OTP Generation

Even without email setup, you can verify OTP is working by checking the log:

**Windows PowerShell:**
```powershell
Get-Content storage/logs/laravel.log -Tail 100 | Select-String -Pattern "OTP Code"
```

The OTP code will be logged there, so you can manually verify the system is working.

---

## After Setup

1. **Test it:**
   - Try registering a new user
   - Check your email (or Mailtrap inbox)
   - You should receive the OTP code

2. **If emails still don't send:**
   - Check `storage/logs/laravel.log` for errors
   - Verify your `.env` file has the correct credentials
   - Make sure you ran `php artisan config:clear`

---

## Production Recommendation

For production, use:
- **SendGrid** (easy, free tier: 100 emails/day)
- **Mailgun** (reliable, free tier: 5,000 emails/month)
- **AWS SES** (very cheap, pay per email)

See `EMAIL_SETUP_GUIDE.md` for detailed setup instructions for these services.

