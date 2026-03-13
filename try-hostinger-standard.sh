#!/bin/bash
# Try Hostinger standard SMTP configuration
# Usage: bash try-hostinger-standard.sh

cd /var/www/myapp/ads-classify-project || exit

echo "=== Setting Hostinger Standard SMTP Configuration ==="
echo ""

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ .env backed up"
echo ""

# Set standard Hostinger SMTP settings
sed -i 's/^MAIL_HOST=.*/MAIL_HOST=smtp.hostinger.com/' .env
sed -i 's/^MAIL_PORT=.*/MAIL_PORT=465/' .env
sed -i 's/^MAIL_ENCRYPTION=.*/MAIL_ENCRYPTION=ssl/' .env
sed -i 's/^MAIL_USERNAME=.*/MAIL_USERNAME=contact@ebyapar.com/' .env

echo "✅ Updated SMTP settings:"
echo "   Host: smtp.hostinger.com"
echo "   Port: 465"
echo "   Encryption: ssl"
echo "   Username: contact@ebyapar.com"
echo ""

# Verify password is still correct
PASSWORD_VALUE=$(grep "^MAIL_PASSWORD=" .env | cut -d '=' -f2)
if echo "$PASSWORD_VALUE" | grep -q "Twakendrajhuka@1234"; then
    echo "✅ Password is correct: Twakendrajhuka@1234"
else
    echo "❌ Password check failed: $PASSWORD_VALUE"
fi

echo ""
echo "=== Current Configuration ==="
grep "^MAIL_" .env | grep -v PASSWORD
echo ""

echo "=== Next Steps ==="
echo "1. Clear cache: php artisan config:clear"
echo "2. Test: php test-smtp.php"
echo ""
echo "If this still fails, we may need to:"
echo "- Check if SMTP is enabled in Hostinger panel"
echo "- Try different SMTP host (smtp.titan.email)"
echo "- Verify password with client again"
echo "- Check if Hostinger requires app password"

