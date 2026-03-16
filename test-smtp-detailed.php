<?php
/**
 * Detailed SMTP Test Script
 * Tests SMTP connection with verbose output
 * Usage: php test-smtp-detailed.php your-email@example.com
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;

$testEmail = $argv[1] ?? 'your-test-email@gmail.com';

echo "=== Detailed SMTP Test ===\n\n";
echo "Test Email: $testEmail\n";
echo "From: " . config('mail.from.address') . "\n\n";

// Enable verbose logging
\Log::info("=== Starting SMTP Test ===");
\Log::info("Test email: $testEmail");

try {
    // Send email synchronously (not queued)
    Mail::to($testEmail)->send(new OtpMail('123456', 'Test User'));
    
    echo "✅ Laravel reports: Email sent successfully!\n\n";
    \Log::info("SMTP test: Email sent successfully to $testEmail");
    
    echo "⚠️  IMPORTANT: If email doesn't arrive, check:\n";
    echo "1. DNS Records (SPF, DKIM, DMARC) - These are CRITICAL for deliverability\n";
    echo "2. Check Hostinger email panel for sent emails\n";
    echo "3. Check spam folder\n";
    echo "4. Wait 5-10 minutes (some providers delay delivery)\n\n";
    
    echo "=== Checking Recent Logs ===\n";
    $logFile = storage_path('logs/laravel.log');
    if (file_exists($logFile)) {
        $recentLogs = shell_exec("tail -20 $logFile | grep -i 'smtp\|mail\|email sent' || echo 'No recent email logs found'");
        echo $recentLogs . "\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error sending email:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    \Log::error("SMTP test failed: " . $e->getMessage());
    \Log::error("Full trace: " . $e->getTraceAsString());
}

echo "\n=== Test Complete ===\n";

