#!/bin/bash
# Update SMTP password on server
# Usage: bash update-smtp-password.sh

cd /var/www/myapp/ads-classify-project || exit

echo "=== Updating SMTP Password ==="
echo ""

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ .env backed up"
echo ""

# Update password (capital T)
sed -i 's/^MAIL_PASSWORD=.*/MAIL_PASSWORD=Twakendrajhuka@1234/' .env

echo "✅ Password updated in .env"
echo ""

# Verify the change
echo "=== Verifying Password Update ==="
grep "^MAIL_PASSWORD=" .env
echo ""

# Clear Laravel cache
php artisan config:clear
php artisan cache:clear
echo "✅ Laravel cache cleared"
echo ""

echo "=== Testing SMTP Connection ==="
echo "Run: php test-smtp.php"
echo ""

