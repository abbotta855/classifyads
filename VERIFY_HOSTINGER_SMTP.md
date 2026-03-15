# Step-by-Step Guide: Verify Hostinger SMTP Settings

## Step 1: Access Hostinger Email Panel

1. Go to: https://hpanel.hostinger.com/ (or the Hostinger login page)
2. Log in with the credentials provided by the client
3. Navigate to **Email** section (usually in the left sidebar or main dashboard)

## Step 2: Find SMTP Settings

1. Click on **Email Accounts** or **Email Management**
2. Find and click on `contact@ebyapar.com`
3. Look for one of these options:
   - **"SMTP Settings"**
   - **"Email Client Configuration"**
   - **"Outgoing Mail Settings"**
   - **"Configure Email Client"**
   - **"IMAP/POP3 Settings"** (SMTP settings are usually here)

## Step 3: Note Down the Exact Settings

You need to find and record:

- **SMTP Host/Server:** (e.g., `smtp.titan.email`, `smtp.hostinger.com`, `mail.titan.email`)
- **SMTP Port:** (usually `465` or `587`)
- **Encryption/SSL/TLS:** (usually `SSL` for port 465, `TLS` for port 587)
- **Username:** (might be `contact@ebyapar.com` or just `contact`)
- **Password:** (should be the same: `Twakendrajhuka@1234`)
- **Authentication Required:** (should be `Yes`)

## Step 4: Check for Special Requirements

- Is there a checkbox to "Enable SMTP" or "Enable Outgoing Mail"?
- Are there any IP restrictions or firewall rules?
- Is there a note about "App Password" or "Application Password"?
- Are there any special instructions or warnings?

## Step 5: Take Screenshot (Optional but Recommended)

Take a screenshot of the SMTP settings page for reference.

---

## What to Do Next:

Once you have the settings, I'll help you:
1. Update the `.env` file on the server
2. Test the SMTP connection
3. Verify emails are working

**Share the settings you found, and I'll create the exact configuration commands!**

