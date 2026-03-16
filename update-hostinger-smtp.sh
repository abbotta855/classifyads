#!/bin/bash
# Update Hostinger SMTP configuration on server
# Usage: bash update-hostinger-smtp.sh

cd /var/www/myapp/ads-classify-project || exit

echo "=== Hostinger SMTP Configuration Update ==="
echo ""
echo "Please provide the SMTP settings from Hostinger panel:"
echo ""

# Get SMTP settings from user
read -p "SMTP Host (e.g., smtp.titan.email or smtp.hostinger.com): " SMTP_HOST
read -p "SMTP Port (usually 465 or 587): " SMTP_PORT
read -p "Encryption (ssl or tls): " SMTP_ENCRYPTION
read -p "Username (full email or just username): " SMTP_USERNAME
read -p "Password (press Enter to keep current): " SMTP_PASSWORD

# If password is empty, keep the current one
if [ -z "$SMTP_PASSWORD" ]; then
    SMTP_PASSWORD=$(grep "^MAIL_PASSWORD=" .env | cut -d '=' -f2-)
    echo "Keeping current password..."
else
    echo "Updating password..."
fi

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backed up .env file"

# Update .env file
echo ""
echo "Updating .env file..."

# Remove old MAIL_* entries (keep only one of each)
sed -i '/^MAIL_MAILER=/d' .env
sed -i '/^MAIL_HOST=/d' .env
sed -i '/^MAIL_PORT=/d' .env
sed -i '/^MAIL_USERNAME=/d' .env
sed -i '/^MAIL_PASSWORD=/d' .env
sed -i '/^MAIL_ENCRYPTION=/d' .env
sed -i '/^MAIL_FROM_ADDRESS=/d' .env
sed -i '/^MAIL_FROM_NAME=/d' .env

# Add new settings
cat >> .env << EOF

# SMTP Configuration (Updated $(date +%Y-%m-%d\ %H:%M:%S))
MAIL_MAILER=smtp
MAIL_HOST=$SMTP_HOST
MAIL_PORT=$SMTP_PORT
MAIL_USERNAME=$SMTP_USERNAME
MAIL_PASSWORD=$SMTP_PASSWORD
MAIL_ENCRYPTION=$SMTP_ENCRYPTION
MAIL_FROM_ADDRESS=contact@ebyapar.com
MAIL_FROM_NAME="Ebyapar"
ADMIN_EMAIL=contact@ebyapar.com
EOF

echo "✅ .env file updated!"
echo ""

# Show current configuration
echo "=== Current SMTP Configuration ==="
grep "^MAIL_" .env | grep -v "PASSWORD" | sed 's/PASSWORD=.*/PASSWORD=***HIDDEN***/'
echo ""

# Clear cache
echo "Clearing Laravel config cache..."
php artisan config:clear
php artisan cache:clear
echo "✅ Cache cleared!"
echo ""

# Test SMTP
echo "=== Testing SMTP Connection ==="
read -p "Do you want to test SMTP now? (y/n): " TEST_NOW

if [ "$TEST_NOW" = "y" ] || [ "$TEST_NOW" = "Y" ]; then
    if [ -f "test-smtp.php" ]; then
        php test-smtp.php
    else
        echo "⚠️  test-smtp.php not found. Skipping test."
    fi
fi

echo ""
echo "=== Next Steps ==="
echo "1. If test passed, try sending an OTP email from the application"
echo "2. Check logs: tail -f storage/logs/laravel.log"
echo "3. If still failing, check Hostinger panel for any special requirements"
echo ""

