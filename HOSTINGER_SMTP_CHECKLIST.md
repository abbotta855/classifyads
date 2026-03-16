# Hostinger SMTP Configuration Checklist

## What to Verify from Hostinger Documentation

### 1. SMTP Server Host
- [ ] Is `smtp.hostinger.com` the correct SMTP host?
- [ ] Or is it something else? (e.g., `smtp.titan.email`, `mail.hostinger.com`, etc.)
- [ ] Are there different SMTP hosts for different regions?

### 2. SMTP Port and Encryption
- [ ] Port 465 with SSL - Is this correct?
- [ ] Port 587 with TLS - Is this correct?
- [ ] Which one should we use?
- [ ] Are there any other ports mentioned?

### 3. Authentication
- [ ] Do we use the full email address (`contact@ebyapar.com`) as username?
- [ ] Or just the part before @ (`contact`)?
- [ ] Is the email account password the same as SMTP password?
- [ ] Do we need to create an "App Password" or "SMTP Password" separately?
- [ ] Is there a different authentication method required?

### 4. SMTP Activation
- [ ] Does SMTP need to be explicitly enabled in Hostinger panel?
- [ ] Is there a toggle or setting to enable SMTP for the account?
- [ ] Are there any restrictions (e.g., only works after X days, requires verification)?

### 5. Special Requirements
- [ ] Are there IP whitelist requirements?
- [ ] Do we need to verify the server IP address first?
- [ ] Are there rate limits?
- [ ] Any special headers or settings required?

### 6. Alternative Methods
- [ ] Does Hostinger offer an API for sending emails?
- [ ] Is there a webhook or HTTP API option?
- [ ] Are there any third-party integrations recommended?

## Current Configuration (What We're Using)

```
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=contact@ebyapar.com
MAIL_PASSWORD=teakendrajhuka@1234
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=contact@ebyapar.com
MAIL_FROM_NAME="Ebyapar"
```

## Error We're Getting

```
535 5.7.8 Error: authentication failed: (reason unavailable)
```

This means:
- ✅ Connection to SMTP server works
- ✅ Port is accessible
- ❌ Authentication credentials are rejected

## What to Look For in Documentation

1. **SMTP Settings Page** - Look for exact host, port, encryption
2. **Authentication Section** - How to authenticate, username format
3. **App Passwords** - If available, how to create them
4. **Troubleshooting** - Common authentication errors and solutions
5. **Examples** - Code examples showing correct configuration

## Important Notes

- The DNS records (MX, SPF, DKIM) being missing is a **separate issue** that affects email deliverability
- But we need to fix SMTP authentication **first** before emails can even be sent
- Once SMTP works, we'll need to add DNS records to Cloudflare

