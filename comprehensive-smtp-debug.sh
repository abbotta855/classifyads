#!/bin/bash
# Comprehensive SMTP Debugging Script
# This will check everything and try different configurations

cd /var/www/myapp/ads-classify-project || exit

echo "=== Comprehensive SMTP Debugging ==="
echo ""

# 1. Check current .env password
echo "1. Checking current password in .env..."
PASSWORD_LINE=$(grep "^MAIL_PASSWORD=" .env)
if [ -n "$PASSWORD_LINE" ]; then
    # Show first character
    FIRST_CHAR=$(echo "$PASSWORD_LINE" | cut -d '=' -f2 | cut -c1)
    LENGTH=$(echo "$PASSWORD_LINE" | cut -d '=' -f2 | wc -c)
    LENGTH=$((LENGTH - 1))  # Subtract 1 for newline
    
    echo "   Password first character: '$FIRST_CHAR'"
    echo "   Password length: $LENGTH characters"
    echo "   Full line: $PASSWORD_LINE"
    
    # Check if it's the correct password
    if echo "$PASSWORD_LINE" | grep -q "Twakendrajhuka@1234"; then
        echo "   ✅ Password appears correct (Twakendrajhuka@1234)"
    else
        echo "   ❌ Password does NOT match 'Twakendrajhuka@1234'"
        echo "   Updating password now..."
        sed -i 's/^MAIL_PASSWORD=.*/MAIL_PASSWORD=Twakendrajhuka@1234/' .env
        echo "   ✅ Password updated"
    fi
else
    echo "   ❌ MAIL_PASSWORD not found in .env!"
fi
echo ""

# 2. Show all mail settings
echo "2. Current mail settings:"
grep "^MAIL_" .env | grep -v PASSWORD
echo ""

# 3. Try different SMTP hosts (if Hostinger uses different host)
echo "3. Possible SMTP hosts to try:"
echo "   - smtp.hostinger.com (current)"
echo "   - smtp.titan.email (Titan email - Hostinger's email service)"
echo "   - mail.hostinger.com"
echo ""

# 4. Check if password has any special characters that need escaping
echo "4. Password analysis:"
PASSWORD_VALUE=$(grep "^MAIL_PASSWORD=" .env | cut -d '=' -f2)
if [[ "$PASSWORD_VALUE" == *"@"* ]]; then
    echo "   ⚠️  Password contains '@' symbol"
    echo "   This should be fine, but some systems have issues"
fi
if [[ "$PASSWORD_VALUE" == *" "* ]]; then
    echo "   ⚠️  Password contains spaces - might need quotes"
fi
echo ""

# 5. Suggest trying with quotes around password
echo "5. Recommendations:"
echo "   a) Verify password is exactly: Twakendrajhuka@1234"
echo "   b) Try with quotes in .env: MAIL_PASSWORD=\"Twakendrajhuka@1234\""
echo "   c) Check Hostinger panel for SMTP settings"
echo "   d) Verify SMTP is enabled for the email account"
echo "   e) Check if Hostinger requires 'App Password' instead"
echo ""

# 6. Create test configurations
echo "6. Would you like to try:"
echo "   - Different SMTP host (smtp.titan.email)?"
echo "   - Password with quotes?"
echo "   - Check Hostinger documentation for exact SMTP settings?"
echo ""

echo "=== Next Steps ==="
echo "1. Verify password in .env matches exactly: Twakendrajhuka@1234"
echo "2. Check Hostinger Email Panel → contact@ebyapar.com → SMTP Settings"
echo "3. Verify SMTP is enabled for this account"
echo "4. Check if Hostinger uses different SMTP host (e.g., smtp.titan.email)"
echo "5. Ask client to verify password and check Hostinger SMTP documentation"

