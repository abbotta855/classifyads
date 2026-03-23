#!/bin/bash
# Check that MAIL_PASSWORD exists in .env (does not print the secret).

cd /var/www/myapp/ads-classify-project || exit

echo "=== MAIL_PASSWORD presence check ==="
echo ""

PASSWORD_LINE=$(grep "^MAIL_PASSWORD=" .env || true)
if [ -n "$PASSWORD_LINE" ]; then
    VAL=$(echo "$PASSWORD_LINE" | cut -d '=' -f2-)
    LEN=${#VAL}
    echo "✅ MAIL_PASSWORD is set ($LEN characters)"
    echo "   Compare with Hostinger email account password if SMTP auth fails."
else
    echo "❌ MAIL_PASSWORD not found — add it to .env (never commit real values)."
fi

echo ""
echo "Next: php artisan config:clear && php test-smtp.php you@example.com"
