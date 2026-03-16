# Find SMTP Settings in Hostinger Email Panel

## Step 1: Log into Hostinger Email Panel

1. **Go to:** https://mail.hostinger.com/v2/auth/login
2. **Email:** `contact@ebyapar.com`
3. **Password:** `Twakendrajhuka@1234`
4. Click **Login**

## Step 2: Find SMTP Settings

Once logged in, look for one of these:

### Option A: Settings/Configuration Menu
- Look for a **gear icon** ⚙️ or **"Settings"** in the top right
- Click on it
- Look for **"Email Client Configuration"** or **"SMTP Settings"**

### Option B: Account Settings
- Look for **"Account"** or **"Email Account Settings"**
- Click on it
- Find **"Outgoing Mail (SMTP)"** or **"SMTP Configuration"**

### Option C: Help/Setup Section
- Look for **"Help"**, **"Setup"**, or **"Configuration"**
- Click on it
- Look for **"Email Client Setup"** or **"SMTP Settings"**

## Step 3: What to Look For

You should see something like this:

```
SMTP Server: smtp.titan.email (or smtp.hostinger.com)
SMTP Port: 465 (or 587)
Encryption: SSL (or TLS)
Username: contact@ebyapar.com (or just "contact")
Password: [your password]
```

## Step 4: Note Down These Values

Please share with me:
1. **SMTP Host/Server:** (e.g., `smtp.titan.email`)
2. **SMTP Port:** (e.g., `465` or `587`)
3. **Encryption:** (e.g., `SSL` or `TLS`)
4. **Username Format:** (e.g., `contact@ebyapar.com` or just `contact`)
5. **Any Special Notes:** (e.g., "App Password required", "SMTP must be enabled")

## Step 5: Take a Screenshot (Optional)

If possible, take a screenshot of the SMTP settings page for reference.

---

## If You Can't Find SMTP Settings

If you can't find SMTP settings in the email panel, try:

1. **Check Hostinger hPanel:**
   - Go to: https://hpanel.hostinger.com/
   - Log in with Hostinger account credentials (not email credentials)
   - Navigate to **Email** → **Email Accounts** → `contact@ebyapar.com`
   - Look for **"Email Client Configuration"** or **"SMTP Settings"**

2. **Contact Hostinger Support:**
   - Ask them: "What are the SMTP settings for contact@ebyapar.com?"
   - They should provide: Host, Port, Encryption, Username format

---

## Once You Have the Settings

Share them with me, and I'll:
1. Update the `.env` configuration
2. Create commands to update your server
3. Help you test the SMTP connection

**I will NOT push to GitHub - you'll handle that yourself!**


