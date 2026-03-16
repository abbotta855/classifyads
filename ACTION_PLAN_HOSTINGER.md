# Action Plan: Configure Hostinger SMTP

## Step 1: Access Hostinger Email Panel

1. **Go to Hostinger Login:**
   - URL: https://hpanel.hostinger.com/
   - Or: https://www.hostinger.com/cpanel

2. **Log in with credentials provided by client**

3. **Navigate to Email Section:**
   - Look for **"Email"** or **"Email Accounts"** in the sidebar or dashboard
   - Click on it

## Step 2: Find SMTP Settings for contact@ebyapar.com

1. **Find the email account:**
   - Click on **"Email Accounts"** or **"Manage Email"**
   - Find `contact@ebyapar.com` in the list
   - Click on it or click **"Manage"** / **"Settings"**

2. **Locate SMTP Settings:**
   - Look for one of these sections:
     - **"SMTP Settings"**
     - **"Email Client Configuration"**
     - **"Outgoing Mail Settings"**
     - **"Configure Email Client"**
     - **"IMAP/POP3 Settings"** (SMTP is usually here)

3. **Note Down These Settings:**
   - **SMTP Host/Server:** (e.g., `smtp.titan.email`, `smtp.hostinger.com`)
   - **SMTP Port:** (usually `465` or `587`)
   - **Encryption:** (usually `SSL` for port 465, `TLS` for port 587)
   - **Username:** (might be `contact@ebyapar.com` or just `contact`)
   - **Password:** (should be `Twakendrajhuka@1234` - verify this is correct)

4. **Check for Special Requirements:**
   - Is there a checkbox to **"Enable SMTP"** or **"Enable Outgoing Mail"**? (Make sure it's checked)
   - Are there any **IP restrictions** or **firewall rules**?
   - Is there a note about **"App Password"** or **"Application Password"**?
   - Are there any **special instructions** or **warnings**?

5. **Take a Screenshot:**
   - Take a screenshot of the SMTP settings page for reference

## Step 3: Update Server Configuration

Once you have the settings, you have two options:

### Option A: Use the Automated Script (Recommended)

1. **SSH into your server:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Navigate to project directory:**
   ```bash
   cd /var/www/myapp/ads-classify-project
   ```

3. **Pull the latest code (if script is in repo):**
   ```bash
   git pull origin main
   ```

4. **Run the update script:**
   ```bash
   chmod +x update-hostinger-smtp.sh
   bash update-hostinger-smtp.sh
   ```

5. **Enter the settings when prompted:**
   - SMTP Host
   - SMTP Port
   - Encryption (ssl or tls)
   - Username
   - Password (or press Enter to keep current)

### Option B: Manual Update

1. **SSH into your server:**
   ```bash
   ssh root@your-server-ip
   cd /var/www/myapp/ads-classify-project
   ```

2. **Backup .env:**
   ```bash
   cp .env .env.backup
   ```

3. **Edit .env file:**
   ```bash
   nano .env
   ```

4. **Update these lines (replace with your actual values):**
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.titan.email
   MAIL_PORT=465
   MAIL_USERNAME=contact@ebyapar.com
   MAIL_PASSWORD=Twakendrajhuka@1234
   MAIL_ENCRYPTION=ssl
   MAIL_FROM_ADDRESS=contact@ebyapar.com
   MAIL_FROM_NAME="Ebyapar"
   ADMIN_EMAIL=contact@ebyapar.com
   ```

5. **Save and exit** (Ctrl+X, then Y, then Enter)

6. **Clear cache:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

## Step 4: Test SMTP Connection

1. **Test using the test script:**
   ```bash
   php test-smtp.php
   ```

2. **Check the output:**
   - ✅ **Success:** "Email sent successfully!"
   - ❌ **Error:** Check the error message

3. **If successful, test from the application:**
   - Try registering a new user (should send OTP email)
   - Try password reset (should send reset code)
   - Check the email inbox for `contact@ebyapar.com`

## Step 5: Verify Everything Works

1. **Check Laravel logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Test OTP email:**
   - Register a new user or request OTP
   - Check if email arrives

3. **Test password reset:**
   - Request password reset
   - Check if email arrives

4. **Test contact form:**
   - Submit contact form
   - Check if admin receives email

## Common Issues & Solutions

### Issue 1: Still Getting 535 Authentication Error

**Possible causes:**
- Password is incorrect
- SMTP is not enabled in Hostinger panel
- Username format is wrong (try full email vs. just username)
- Port/encryption mismatch (try 465/SSL or 587/TLS)

**Solutions:**
1. Double-check password in Hostinger panel
2. Verify SMTP is enabled
3. Try different username format
4. Try different port/encryption combination

### Issue 2: Connection Timeout

**Possible causes:**
- Firewall blocking port
- Wrong SMTP host
- Server IP not whitelisted

**Solutions:**
1. Check if port 465 or 587 is open on server
2. Verify SMTP host is correct
3. Check Hostinger panel for IP whitelist settings

### Issue 3: Emails Not Arriving

**Possible causes:**
- Emails going to spam
- DNS records not configured
- SMTP sending but emails not delivered

**Solutions:**
1. Check spam folder
2. Verify DNS records (MX, SPF, DKIM) are set correctly
3. Check email logs in Hostinger panel

## What to Share with Me

After you've checked Hostinger panel, please share:

1. **SMTP Host:** (e.g., `smtp.titan.email`)
2. **SMTP Port:** (e.g., `465`)
3. **Encryption:** (e.g., `SSL` or `TLS`)
4. **Username Format:** (e.g., `contact@ebyapar.com` or just `contact`)
5. **Any Special Requirements:** (e.g., "App Password required", "SMTP must be enabled", etc.)
6. **Screenshot:** (if possible, of the SMTP settings page)

Then I'll help you update the configuration!

