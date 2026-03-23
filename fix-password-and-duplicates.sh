#!/bin/bash
# Remove duplicate MAIL_PASSWORD lines and set a single value (prompted — not stored in git).
# Usage: bash fix-password-and-duplicates.sh

cd /var/www/myapp/ads-classify-project || exit

echo "=== Fixing duplicate MAIL_PASSWORD entries ==="
echo ""

cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ .env backed up"
echo ""

sed -i '/^MAIL_PASSWORD=/d' .env
echo "✅ Removed all MAIL_PASSWORD entries"
echo ""

read -rsp "Enter mailbox password for MAIL_PASSWORD (input hidden): " MAIL_PW
echo ""
if [ -z "$MAIL_PW" ]; then
  echo "❌ Empty password — aborting."
  exit 1
fi

# shellcheck disable=SC2094
echo "MAIL_PASSWORD=${MAIL_PW}" >> .env
echo "✅ Added one MAIL_PASSWORD= line to .env"
echo ""

COUNT=$(grep -c "^MAIL_PASSWORD=" .env)
if [ "$COUNT" -eq 1 ]; then
    echo "✅ Only one MAIL_PASSWORD entry (correct)"
else
    echo "❌ Found $COUNT MAIL_PASSWORD entries (should be 1)"
fi

echo ""
echo "=== Next steps ==="
echo "1. php artisan config:clear"
echo "2. php test-smtp.php you@example.com"
