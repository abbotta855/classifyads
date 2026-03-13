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

# Verify password
PASSWORD_VALUE=$(grep "^MAIL_PASSWORD=" .env | cut -d '=' -f2)
if echo "$PASSWORD_VALUE" | grep -q "Twakendrajhuka@1234"; then
    echo "✅ Password is correct: Twakendrajhuka@1234"
else
    echo "❌ Password issue: $PASSWORD_VALUE"
    echo "   Expected: Twakendrajhuka@1234"
fi

echo ""
echo "=== Current Configuration ==="
grep "^MAIL_" .env | head -7
echo ""

echo "=== Next Steps ==="
echo "1. Clear cache: php artisan config:clear"
echo "2. Test: php test-smtp.php"
echo ""
echo "If still failing, try port 587 with TLS:"
echo "  sed -i 's/^MAIL_PORT=.*/MAIL_PORT=587/' .env"
echo "  sed -i 's/^MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=tls/' .env"

