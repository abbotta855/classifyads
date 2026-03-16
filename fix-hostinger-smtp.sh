#!/bin/bash
# Fix Hostinger SMTP Authentication Issues
# This script handles password encoding and tests different SMTP configurations

cd /var/www/myapp/ads-classify-project || exit

echo "=== Fixing Hostinger SMTP Configuration ==="
echo ""

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ .env backed up"
echo ""

# Remove duplicate MAIL_FROM entries
sed -i '/^MAIL_FROM_ADDRESS=/d' .env
sed -i '/^MAIL_FROM_NAME=/d' .env
sed -i '/^MAIL_SCHEME=/d' .env

# Remove old MAIL_ entries (keep only the last set)
grep -v "^MAIL_" .env > .env.tmp
mv .env.tmp .env

# Add properly formatted SMTP configuration
cat >> .env << 'EOF'

# SMTP Configuration (Hostinger)
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=contact@ebyapar.com
MAIL_PASSWORD=teakendrajhuka@1234
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=contact@ebyapar.com
MAIL_FROM_NAME="Ebyapar"
ADMIN_EMAIL=contact@ebyapar.com
EOF

echo "✅ SMTP configuration added to .env"
echo ""

# Clear Laravel cache
php artisan config:clear
php artisan cache:clear
echo "✅ Laravel cache cleared"
echo ""

# Verify configuration
echo "=== Current SMTP Configuration ==="
grep "^MAIL_" .env
echo ""

echo "=== Testing SMTP Connection ==="
echo "Note: If authentication still fails, the password might be incorrect."
echo "Please verify the password in Hostinger email panel."
echo ""
echo "Run: php test-smtp.php"
echo ""

