#!/bin/bash
# Fix password typo and remove duplicates
# Usage: bash fix-password-and-duplicates.sh

cd /var/www/myapp/ads-classify-project || exit

echo "=== Fixing Password and Removing Duplicates ==="
echo ""

# Backup .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ .env backed up"
echo ""

# Remove ALL MAIL_PASSWORD lines
sed -i '/^MAIL_PASSWORD=/d' .env
echo "✅ Removed all MAIL_PASSWORD entries"
echo ""

# Add correct password (with 'w' not 'e')
echo 'MAIL_PASSWORD=Twakendrajhuka@1234' >> .env
echo "✅ Added correct password: Twakendrajhuka@1234"
echo ""

# Verify
echo "=== Verification ==="
echo "MAIL_PASSWORD entries in .env:"
grep "^MAIL_PASSWORD=" .env
echo ""

COUNT=$(grep -c "^MAIL_PASSWORD=" .env)
if [ "$COUNT" -eq 1 ]; then
    echo "✅ Only one MAIL_PASSWORD entry found (correct)"
else
    echo "❌ Found $COUNT MAIL_PASSWORD entries (should be 1)"
fi

echo ""
echo "=== Password Check ==="
PASSWORD_VALUE=$(grep "^MAIL_PASSWORD=" .env | cut -d '=' -f2)
if echo "$PASSWORD_VALUE" | grep -q "Twakendrajhuka@1234"; then
    echo "✅ Password is correct: Twakendrajhuka@1234"
else
    echo "❌ Password is still wrong: $PASSWORD_VALUE"
    echo "   Expected: Twakendrajhuka@1234"
fi

echo ""
echo "=== Next Steps ==="
echo "1. Clear config cache: php artisan config:clear"
echo "2. Test SMTP: php test-smtp.php"

