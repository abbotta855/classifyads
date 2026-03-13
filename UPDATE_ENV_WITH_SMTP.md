# Update .env File with Hostinger SMTP Credentials

## ✅ What We Have
- **Email Address:** `contact@ebyapar.com`
- **Password:** `teakendrajhuka@1234`
- **SMTP Host:** `smtp.hostinger.com`
- **SMTP Port:** `465`
- **Encryption:** `ssl`

## 📝 Update Your .env File

Add or update these lines in your `.env` file:

```env
# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=contact@ebyapar.com
MAIL_PASSWORD=teakendrajhuka@1234
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=contact@ebyapar.com
MAIL_FROM_NAME="${APP_NAME}"

# Admin Email (for receiving contact form submissions)
ADMIN_EMAIL=contact@ebyapar.com
```

## 🔄 After Updating .env

1. **Clear Laravel config cache:**
   ```bash
   php artisan config:clear
   ```

2. **Test OTP functionality:**
   - Try registering a new user
   - Request OTP for password reset
   - Check if emails are received

## 📧 Email Address Usage

- **`contact@ebyapar.com`** will be used for:
  - ✅ Sending OTP codes to users
  - ✅ Sending password reset emails
  - ✅ Receiving contact form submissions (via `ADMIN_EMAIL`)
  - ✅ Sending support chat replies (if configured)

## 🔒 Security Note

The `.env` file is already in `.gitignore`, so your password is safe and won't be committed to Git.

## ⚠️ Important

- Make sure DNS records (MX, SPF, DKIM) are properly configured on Cloudflare
- If emails still don't send, check `storage/logs/laravel.log` for error messages
- The system will try SendGrid first, then fall back to SMTP automatically


