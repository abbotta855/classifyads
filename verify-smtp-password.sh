#!/bin/bash
# Verify SMTP password in .env file
# Usage: bash verify-smtp-password.sh

cd /var/www/myapp/ads-classify-project || exit

echo "=== Verifying SMTP Password in .env ==="
echo ""

# Show current password (masked)
echo "Current MAIL_PASSWORD in .env:"
PASSWORD_LINE=$(grep "^MAIL_PASSWORD=" .env)
if [ -n "$PASSWORD_LINE" ]; then
    # Show first and last character only
    PASSWORD_VALUE=$(echo "$PASSWORD_LINE" | cut -d '=' -f2)
    FIRST_CHAR=$(echo "$PASSWORD_VALUE" | cut -c1)
    LAST_CHAR=$(echo "$PASSWORD_VALUE" | rev | cut -c1)
    LENGTH=${#PASSWORD_VALUE}
    echo "Password starts with: '$FIRST_CHAR'"
    echo "Password ends with: '$LAST_CHAR'"
    echo "Password length: $LENGTH characters"
    echo ""
    echo "Full line (for verification):"
    echo "$PASSWORD_LINE"
else
    echo "❌ MAIL_PASSWORD not found in .env!"
fi

echo ""
echo "=== Expected Password ==="
echo "Should be: Twakendrajhuka@1234"
echo "First character should be: T (capital)"
echo "Length should be: 20 characters"
echo ""

# Check if it matches expected
if echo "$PASSWORD_LINE" | grep -q "Twakendrajhuka@1234"; then
    echo "✅ Password appears to be correct in .env"
else
    echo "❌ Password does NOT match expected value!"
    echo "Updating now..."
    sed -i 's/^MAIL_PASSWORD=.*/MAIL_PASSWORD=Twakendrajhuka@1234/' .env
    echo "✅ Password updated. Please clear cache and test again."
fi

echo ""
echo "=== Next Steps ==="
echo "1. Verify password is correct above"
echo "2. Clear config cache: php artisan config:clear"
echo "3. Test again: php test-smtp.php"

