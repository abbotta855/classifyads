#!/bin/bash
# SMTP sanity checks (does not store or assert a specific password — compare with Hostinger panel).

cd /var/www/myapp/ads-classify-project || exit

echo "=== SMTP / .env checks ==="
echo ""

echo "1. MAIL_PASSWORD present?"
PASSWORD_LINE=$(grep "^MAIL_PASSWORD=" .env || true)
if [ -n "$PASSWORD_LINE" ]; then
    VAL=$(echo "$PASSWORD_LINE" | cut -d '=' -f2-)
    LEN=${#VAL}
    echo "   ✅ MAIL_PASSWORD is set (length: $LEN chars, value not shown)"
else
    echo "   ❌ MAIL_PASSWORD missing in .env"
fi
echo ""

echo "2. Other MAIL_* (password redacted):"
grep "^MAIL_" .env | sed 's/^MAIL_PASSWORD=.*/MAIL_PASSWORD=***HIDDEN***/'
echo ""

echo "3. Hosts to try if connection fails:"
echo "   - smtp.hostinger.com (SSL 465 or TLS 587)"
echo "   - smtp.titan.email (some Hostinger mailboxes)"
echo ""

echo "4. If password has @ or spaces, quote in .env, e.g.:"
echo "   MAIL_PASSWORD=\"your-password-here\""
echo ""

echo "=== Next steps ==="
echo "1. Match MAIL_USERNAME / MAIL_PASSWORD with Hostinger → Email → account"
echo "2. php artisan config:clear && php test-smtp.php your@email.com"
echo "3. See VERIFY_DNS_RECORDS.md if mail accepts but never arrives"
