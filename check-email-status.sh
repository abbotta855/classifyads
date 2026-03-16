#!/bin/bash
# Check email sending status and test SMTP

cd /var/www/myapp/ads-classify-project || exit

echo "=== 1. Recent OTP Generation Logs ==="
tail -100 storage/logs/laravel.log | grep -i "OTP\|otp" | tail -15
echo ""

echo "=== 2. Recent Email Sending Attempts ==="
tail -100 storage/logs/laravel.log | grep -i "email sent\|Failed to send\|SMTP" | tail -10
echo ""

echo "=== 3. Testing SMTP Connection ==="
php test-smtp.php
echo ""

echo "=== 4. Check Queue Status (if using queues) ==="
php artisan queue:work --once 2>&1 | head -5 || echo "No queue worker running (this is OK if emails are sent synchronously)"
echo ""

echo "=== 5. Check if there are any failed jobs ==="
php artisan queue:failed 2>&1 | head -10 || echo "No failed jobs table or no failed jobs"


