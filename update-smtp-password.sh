#!/bin/bash
# Set MAIL_PASSWORD in .env from prompt (password never stored in this repo).
# Usage: bash update-smtp-password.sh

cd /var/www/myapp/ads-classify-project || exit

echo "=== Update MAIL_PASSWORD in .env ==="
echo ""

cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ .env backed up"
echo ""

read -rsp "Enter new MAIL_PASSWORD (input hidden): " MAIL_PW
echo ""
if [ -z "$MAIL_PW" ]; then
  echo "❌ Empty password — aborting."
  exit 1
fi

if grep -q '^MAIL_PASSWORD=' .env; then
  sed -i '/^MAIL_PASSWORD=/d' .env
fi
echo "MAIL_PASSWORD=${MAIL_PW}" >> .env

echo "✅ MAIL_PASSWORD updated"
echo ""

php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Laravel cache cleared (if artisan available)"
echo ""
echo "Run: php test-smtp.php you@example.com"
