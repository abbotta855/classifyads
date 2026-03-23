#!/bin/bash
# Fix Titan email configuration with full email username
# Usage: bash fix-titan-email-config.sh

cd /var/www/myapp/ads-classify-project || exit

echo "=== Setting Titan Email Configuration ==="
echo ""

# Set Titan email SMTP settings with full email as username
sed -i 's/^MAIL_HOST=.*/MAIL_HOST=smtp.titan.email/' .env
sed -i 's/^MAIL_PORT=.*/MAIL_PORT=465/' .env
sed -i 's/^MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=ssl/' .env
sed -i 's/^MAIL_USERNAME=.*/MAIL_USERNAME=contact@ebyapar.com/' .env

echo "✅ Updated to Titan Email SMTP:"
echo "   Host: smtp.titan.email"
echo "   Port: 465"
echo "   Encryption: ssl"
echo "   Username: contact@ebyapar.com"
echo ""

# Verify password is set (value not shown)
PASSWORD_VALUE=$(grep "^MAIL_PASSWORD=" .env | cut -d '=' -f2-)
if [ -n "$PASSWORD_VALUE" ]; then
    echo "✅ MAIL_PASSWORD is set (verify against Hostinger if SMTP fails)"
else
    echo "❌ MAIL_PASSWORD missing — set in .env"
fi

echo ""
echo "=== Current Configuration ==="
grep "^MAIL_" .env | head -7 | sed 's/^MAIL_PASSWORD=.*/MAIL_PASSWORD=***HIDDEN***/'
echo ""

echo "=== Next Steps ==="
echo "1. Clear cache: php artisan config:clear"
echo "2. Test: php test-smtp.php"
echo ""
echo "If still failing, try port 587 with TLS:"
echo "  sed -i 's/^MAIL_PORT=.*/MAIL_PORT=587/' .env"
echo "  sed -i 's/^MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=tls/' .env"

