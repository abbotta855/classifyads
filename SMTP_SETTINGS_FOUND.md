# Hostinger SMTP Settings - Found!

## ✅ Settings from Hostinger Email Panel

Based on the "Connect Apps & Devices" section in Hostinger Email Panel:

### **Outgoing Server (SMTP):**
- **Hostname:** `smtp.hostinger.com`
- **Port:** `465`
- **TLS/SSL:** ✅ Enabled (SSL)
- **Username:** `contact@ebyapar.com` (full email address)
- **Password:** `Twakendrajhuka@1234`

### **Configuration Summary:**
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=contact@ebyapar.com
MAIL_PASSWORD=Twakendrajhuka@1234
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=contact@ebyapar.com
MAIL_FROM_NAME="Ebyapar"
ADMIN_EMAIL=contact@ebyapar.com
```

## 📝 What to Do Next

### **On Your Server:**

1. **SSH into your server:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Navigate to project directory:**
   ```bash
   cd /var/www/myapp/ads-classify-project
   ```

3. **Pull the latest code (to get the update script):**
   ```bash
   git pull origin main
   ```

4. **Run the update script:**
   ```bash
   chmod +x update-hostinger-smtp-config.sh
   bash update-hostinger-smtp-config.sh
   ```

5. **Test SMTP connection:**
   ```bash
   php test-smtp.php
   ```

6. **If test passes, try from the application:**
   - Register a new user (should send OTP email)
   - Request password reset (should send reset code)
   - Check `contact@ebyapar.com` inbox for emails

## 🔍 Important Notes

1. **Port 465 = SSL:** Port 465 with TLS/SSL enabled means we use `ssl` encryption (not `tls`)
2. **Full Email as Username:** Use `contact@ebyapar.com` as the username (not just `contact`)
3. **Domain Setup Warning:** The yellow banner about incomplete domain setup might affect email delivery. If emails still don't work after SMTP is configured, we may need to check DNS records (MX, SPF, DKIM).

## ✅ Expected Result

After running the update script and testing:
- ✅ SMTP authentication should succeed (no more 535 error)
- ✅ Test email should be sent successfully
- ✅ OTP and password reset emails should work

## 🐛 If Still Not Working

If you still get errors after updating:

1. **Check the error message** in `test-smtp.php` output
2. **Check Laravel logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```
3. **Verify password is correct** (no typos, no extra spaces)
4. **Check if SMTP is enabled** in Hostinger panel (if there's a toggle)
5. **Contact Hostinger support** if authentication still fails

---

**Ready to update?** Run the commands above on your server!


