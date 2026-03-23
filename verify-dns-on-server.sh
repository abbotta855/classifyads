#!/bin/bash
# Comprehensive DNS verification script for Hostinger email

echo "=========================================="
echo "  Hostinger DNS Records Verification"
echo "=========================================="
echo ""

echo "1. Checking MX Records:"
echo "   Expected: mx1.hostinger.com (priority 5) and mx2.hostinger.com (priority 10)"
echo "   Actual:"
dig MX ebyapar.com +short | sed 's/^/     /'
echo ""

echo "2. Checking SPF Record:"
echo "   Expected: v=spf1 include:_spf.mail.hostinger.com ~all"
echo "   Actual:"
dig TXT ebyapar.com +short | grep -i spf | sed 's/^/     /'
if [ $? -ne 0 ]; then
    echo "     ❌ SPF record not found!"
fi
echo ""

echo "3. Checking DKIM Records:"
echo "   Expected: All three should resolve to hostingermail-*.dkim.mail.hostinger.com"
echo ""
echo "   hostingermail-a._domainkey:"
result_a=$(dig CNAME hostingermail-a._domainkey.ebyapar.com +short)
if [ -z "$result_a" ]; then
    echo "     ❌ Not found!"
else
    echo "     ✅ $result_a"
fi
echo ""
echo "   hostingermail-b._domainkey:"
result_b=$(dig CNAME hostingermail-b._domainkey.ebyapar.com +short)
if [ -z "$result_b" ]; then
    echo "     ❌ Not found!"
else
    echo "     ✅ $result_b"
fi
echo ""
echo "   hostingermail-c._domainkey:"
result_c=$(dig CNAME hostingermail-c._domainkey.ebyapar.com +short)
if [ -z "$result_c" ]; then
    echo "     ❌ Not found!"
else
    echo "     ✅ $result_c"
fi
echo ""

echo "4. Checking DMARC Record:"
echo "   Expected: v=DMARC1; p=none"
echo "   Actual:"
dig TXT _dmarc.ebyapar.com +short | sed 's/^/     /'
if [ $? -ne 0 ]; then
    echo "     ❌ DMARC record not found!"
fi
echo ""

echo "5. Testing SMTP Connection:"
echo "   Running test email..."
cd /var/www/myapp/ads-classify-project 2>/dev/null || cd $(dirname $0)
php test-smtp.php daltonrosemond.snow@gmail.com 2>&1 | tail -n 5
echo ""

echo "=========================================="
echo "  Verification Complete"
echo "=========================================="
echo ""
echo "If all DNS records show ✅ but Hostinger still blocks emails:"
echo "1. Check Hostinger Email Panel for 'Verify Domain' option"
echo "2. Contact Hostinger Support with the message template"
echo "3. See HOSTINGER_STILL_BLOCKING_AFTER_2_DAYS.md for details"
echo ""




