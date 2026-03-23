#!/bin/bash
# Quick script to check if Hostinger has started sending emails

echo "=== Hostinger Email Status Check ==="
echo ""

echo "1. Checking DNS Records (should all resolve):"
echo "   MX Records:"
dig MX ebyapar.com +short | sed 's/^/     /'
echo ""
echo "   SPF Record:"
dig TXT ebyapar.com +short | grep spf | sed 's/^/     /'
echo ""
echo "   DKIM Records:"
echo "     hostingermail-a._domainkey:"
dig CNAME hostingermail-a._domainkey.ebyapar.com +short | sed 's/^/       /'
echo "     hostingermail-b._domainkey:"
dig CNAME hostingermail-b._domainkey.ebyapar.com +short | sed 's/^/       /'
echo "     hostingermail-c._domainkey:"
dig CNAME hostingermail-c._domainkey.ebyapar.com +short | sed 's/^/       /'
echo ""
echo "   DMARC Record:"
dig TXT _dmarc.ebyapar.com +short | sed 's/^/     /'
echo ""

echo "2. Recent Laravel Email Logs:"
if [ -f storage/logs/laravel.log ]; then
    echo "   Last 20 lines related to email:"
    tail -n 100 storage/logs/laravel.log | grep -i "mail\|smtp\|email" | tail -n 20 | sed 's/^/     /'
else
    echo "     No Laravel log file found"
fi
echo ""

echo "3. Test Email Command:"
echo "   Run: php test-smtp.php daltonrosemond.snow@gmail.com"
echo ""

echo "4. Check Hostinger Panel:"
echo "   - Go to: https://mail.hostinger.com"
echo "   - Check 'Sent' folder - emails should appear here"
echo "   - Yellow banner should disappear when validation completes"
echo ""

echo "=== Check Complete ==="




