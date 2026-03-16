<?php
/**
 * SMTP Test Script
 * Run this on your server to test SMTP connection
 * Usage: php test-smtp.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;

echo "=== SMTP Configuration Test ===\n\n";

// Check .env configuration
echo "Checking .env configuration:\n";
echo "MAIL_MAILER: " . env('MAIL_MAILER', 'NOT SET') . "\n";
echo "MAIL_HOST: " . env('MAIL_HOST', 'NOT SET') . "\n";
echo "MAIL_PORT: " . env('MAIL_PORT', 'NOT SET') . "\n";
echo "MAIL_USERNAME: " . env('MAIL_USERNAME', 'NOT SET') . "\n";
echo "MAIL_PASSWORD: " . (env('MAIL_PASSWORD') ? '***SET***' : 'NOT SET') . "\n";
echo "MAIL_ENCRYPTION: " . env('MAIL_ENCRYPTION', 'NOT SET') . "\n";
echo "MAIL_FROM_ADDRESS: " . env('MAIL_FROM_ADDRESS', 'NOT SET') . "\n";
echo "MAIL_FROM_NAME: " . env('MAIL_FROM_NAME', 'NOT SET') . "\n\n";

// Check config/mail.php
$mailConfig = config('mail');
echo "Mail Config (from config cache):\n";
echo "Default Mailer: " . ($mailConfig['default'] ?? 'NOT SET') . "\n";
if (isset($mailConfig['mailers']['smtp'])) {
    $smtp = $mailConfig['mailers']['smtp'];
    echo "SMTP Host: " . ($smtp['host'] ?? 'NOT SET') . "\n";
    echo "SMTP Port: " . ($smtp['port'] ?? 'NOT SET') . "\n";
    echo "SMTP Encryption: " . ($smtp['encryption'] ?? 'NOT SET') . "\n";
    echo "SMTP Username: " . ($smtp['username'] ?? 'NOT SET') . "\n";
    echo "SMTP Password: " . ($smtp['password'] ? '***SET***' : 'NOT SET') . "\n";
}
echo "\n";

// Test email sending
echo "Testing email send...\n";
// Get email from command line argument (support both $argv and $_SERVER['argv'])
$testEmail = 'your-test-email@gmail.com';
if (isset($argv) && isset($argv[1]) && !empty($argv[1])) {
    $testEmail = $argv[1];
} elseif (isset($_SERVER['argv']) && isset($_SERVER['argv'][1]) && !empty($_SERVER['argv'][1])) {
    $testEmail = $_SERVER['argv'][1];
}
echo "Sending test email to: $testEmail\n";

try {
    Mail::to($testEmail)->send(new OtpMail('123456', 'Test User'));
    echo "✅ Email sent successfully!\n";
    echo "Check your inbox (and spam folder) for the test email.\n";
    echo "\nNote: If email doesn't arrive, check:\n";
    echo "1. Spam/Junk folder\n";
    echo "2. DNS records (MX, SPF, DKIM) - these affect deliverability\n";
    echo "3. Laravel logs: tail -f storage/logs/laravel.log\n";
} catch (\Exception $e) {
    echo "❌ Error sending email:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "\nFull trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";

