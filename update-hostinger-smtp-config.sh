#!/bin/bash
# Update Hostinger SMTP configuration on server
# Based on settings from Hostinger Email Panel: Connect Apps & Devices
# SMTP Host: smtp.hostinger.com
# SMTP Port: 465
# Encryption: SSL

cd /var/www/myapp/ads-classify-project || exit

echo "=== Updating Hostinger SMTP Configuration ==="
echo ""

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backed up .env file"
echo ""

# Remove old MAIL_* entries (keep only one of each)
echo "Removing old MAIL_* entries..."
sed -i '/^MAIL_MAILER=/d' .env
sed -i '/^MAIL_HOST=/d' .env
sed -i '/^MAIL_PORT=/d' .env
sed -i '/^MAIL_USERNAME=/d' .env
sed -i '/^MAIL_PASSWORD=/d' .env
sed -i '/^MAIL_ENCRYPTION=/d' .env
sed -i '/^MAIL_FROM_ADDRESS=/d' .env
sed -i '/^MAIL_FROM_NAME=/d' .env
sed -i '/^ADMIN_EMAIL=/d' .env

# Add new settings at the end of .env
echo "Adding new SMTP configuration..."
cat >> .env << 'EOF'

# SMTP Configuration - Hostinger (Updated from Email Panel)
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

echo "✅ .env file updated!"
echo ""

# Show current configuration (hide password)
echo "=== Current SMTP Configuration ==="
grep "^MAIL_" .env | sed 's/MAIL_PASSWORD=.*/MAIL_PASSWORD=***HIDDEN***/'
echo ""

# Clear cache
echo "Clearing Laravel config cache..."
php artisan config:clear
php artisan cache:clear
echo "✅ Cache cleared!"
echo ""

echo "=== Configuration Complete ==="
echo ""
echo "Next steps:"
echo "1. Test SMTP: php test-smtp.php"
echo "2. Check logs: tail -f storage/logs/laravel.log"
echo "3. Try sending OTP email from the application"
echo ""



