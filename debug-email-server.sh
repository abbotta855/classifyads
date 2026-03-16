#!/bin/bash
# Email Debugging Script - Run this on your server
# Usage: bash debug-email-server.sh

echo "=== Email Configuration Debugging ==="
echo ""

cd /var/www/myapp/ads-classify-project || exit

echo "1. Checking .env file SMTP configuration..."
echo "-------------------------------------------"
grep -E "^MAIL_" .env | grep -v PASSWORD || echo "⚠️  No MAIL_* variables found in .env"
echo ""

echo "2. Checking if MAIL_MAILER is set to 'smtp'..."
if grep -q "^MAIL_MAILER=smtp" .env; then
    echo "✅ MAIL_MAILER is set to 'smtp'"
else
    echo "❌ MAIL_MAILER is NOT set to 'smtp'"
    echo "   Current value: $(grep "^MAIL_MAILER=" .env || echo 'NOT SET')"
fi
echo ""

echo "3. Checking SMTP credentials..."
MAIL_HOST=$(grep "^MAIL_HOST=" .env | cut -d '=' -f2)
MAIL_PORT=$(grep "^MAIL_PORT=" .env | cut -d '=' -f2)
MAIL_USERNAME=$(grep "^MAIL_USERNAME=" .env | cut -d '=' -f2)
MAIL_PASSWORD=$(grep "^MAIL_PASSWORD=" .env | cut -d '=' -f2)
MAIL_ENCRYPTION=$(grep "^MAIL_ENCRYPTION=" .env | cut -d '=' -f2)

echo "   MAIL_HOST: ${MAIL_HOST:-NOT SET}"
echo "   MAIL_PORT: ${MAIL_PORT:-NOT SET}"
echo "   MAIL_USERNAME: ${MAIL_USERNAME:-NOT SET}"
echo "   MAIL_PASSWORD: ${MAIL_PASSWORD:+***SET***}"
echo "   MAIL_ENCRYPTION: ${MAIL_ENCRYPTION:-NOT SET}"
echo ""

echo "4. Checking Laravel config cache..."
php artisan config:show mail.default 2>/dev/null || echo "⚠️  Config cache might be stale"
echo ""

echo "5. Recent email-related log entries..."
echo "-------------------------------------------"
tail -50 storage/logs/laravel.log | grep -i "mail\|smtp\|otp\|email\|send" | tail -20 || echo "No email-related logs found"
echo ""

echo "6. Testing SMTP connection (if credentials are set)..."
if [ -n "$MAIL_HOST" ] && [ -n "$MAIL_USERNAME" ] && [ -n "$MAIL_PASSWORD" ]; then
    echo "   Running test-smtp.php..."
    php test-smtp.php 2>&1 | head -30
else
    echo "   ⚠️  SMTP credentials not fully configured, skipping test"
fi
echo ""

echo "7. Checking if port 465 is accessible..."
if command -v nc &> /dev/null; then
    if nc -zv -w5 ${MAIL_HOST:-smtp.hostinger.com} ${MAIL_PORT:-465} 2>&1 | grep -q "succeeded"; then
        echo "✅ Port ${MAIL_PORT:-465} is accessible"
    else
        echo "❌ Port ${MAIL_PORT:-465} is NOT accessible (might be blocked by firewall)"
    fi
else
    echo "⚠️  'nc' command not available, skipping port check"
fi
echo ""

echo "=== Debugging Complete ==="
echo ""
echo "Next steps:"
echo "1. If MAIL_MAILER is not 'smtp', update .env file"
echo "2. Run: php artisan config:clear"
echo "3. Run: php artisan cache:clear"
echo "4. Check logs: tail -f storage/logs/laravel.log"
echo "5. Test email: php test-smtp.php"

