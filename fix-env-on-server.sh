#!/bin/bash
# Add Hostinger SMTP settings to .env file

cd /var/www/myapp/ads-classify-project || exit

# Add SMTP configuration to .env
cat >> .env << 'EOF'

# SMTP Configuration - Hostinger (From Email Panel)
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=contact@ebyapar.com
MAIL_PASSWORD=Twakendrajhuka@1234
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=contact@ebyapar.com
MAIL_FROM_NAME="Ebyapar"
ADMIN_EMAIL=contact@ebyapar.com
EOF

echo "✅ SMTP settings added to .env"
echo ""
echo "=== Current Configuration ==="
grep "^MAIL_" .env | sed 's/MAIL_PASSWORD=.*/MAIL_PASSWORD=***HIDDEN***/'
echo ""

