# How to Get Mailtrap SMTP Credentials

## Important: You Need SMTP Credentials, Not Login Credentials!

The credentials you provided are your **account login** credentials, but we need the **SMTP credentials** which are different.

## Steps to Get SMTP Credentials:

### Step 1: Go to Email Sandbox
1. In the left sidebar, click on **"Transactional"** → **"Sandboxes"** (or click the "Email Sandbox" card)
2. You should see a list of sandboxes/inboxes

### Step 2: Create or Select an Inbox
1. If you don't have an inbox yet, click **"Add Inbox"** or **"Create Inbox"**
2. Give it a name like "My App Testing"
3. Click **"Create"** or **"Add"**

### Step 3: Get SMTP Credentials
1. Click on your inbox/sandbox
2. You'll see tabs at the top: **"Inbox"**, **"SMTP Settings"**, **"API"**, etc.
3. Click on **"SMTP Settings"** tab
4. You'll see different integration options
5. Select **"Laravel"** from the dropdown (or look for "SMTP" section)
6. You'll see credentials that look like this:

```
Host: smtp.mailtrap.io
Port: 2525
Username: abc123def456ghi789  (long random string)
Password: xyz789uvw012rst345  (long random string)
```

### Step 4: Copy These Values
- **Username**: A long string (NOT your email address)
- **Password**: A long string (NOT your account password)

These are the credentials you need to share with me!

---

## Alternative: If You See "Integrations" Tab
1. Click on your inbox
2. Look for **"Integrations"** tab
3. Select **"Laravel"**
4. Copy the Username and Password shown there

---

## What the Credentials Look Like:
- ✅ **Correct SMTP Username**: `a1b2c3d4e5f6g7h8i9j0` (long alphanumeric string)
- ❌ **NOT**: Your email address or name
- ✅ **Correct SMTP Password**: `x9y8z7w6v5u4t3s2r1q0` (long alphanumeric string)
- ❌ **NOT**: Your account password

