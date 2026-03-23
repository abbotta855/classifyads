<?php
/**
 * Verify Laravel is reading password correctly from .env
 * Usage: php verify-password-in-laravel.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Password Verification in Laravel ===\n\n";

// Check .env directly
echo "1. Reading from .env file directly:\n";
$envFile = file_get_contents(__DIR__ . '/.env');
if (preg_match('/^MAIL_PASSWORD=(.+)$/m', $envFile, $matches)) {
    $passwordFromEnv = trim($matches[1], '"\'');
    echo "   Password from .env: " . substr($passwordFromEnv, 0, 1) . str_repeat('*', strlen($passwordFromEnv) - 2) . substr($passwordFromEnv, -1) . "\n";
    echo "   Password length: " . strlen($passwordFromEnv) . " characters\n";
    echo "   First char: '" . substr($passwordFromEnv, 0, 1) . "'\n";
    echo "   Last char: '" . substr($passwordFromEnv, -1) . "'\n";
} else {
    echo "   ❌ MAIL_PASSWORD not found in .env\n";
}

echo "\n";

// Check env() function
echo "2. Reading via env() function:\n";
$passwordFromEnv = env('MAIL_PASSWORD');
if ($passwordFromEnv) {
    echo "   Password from env(): " . substr($passwordFromEnv, 0, 1) . str_repeat('*', strlen($passwordFromEnv) - 2) . substr($passwordFromEnv, -1) . "\n";
    echo "   Password length: " . strlen($passwordFromEnv) . " characters\n";
    echo "   First char: '" . substr($passwordFromEnv, 0, 1) . "'\n";
    echo "   Last char: '" . substr($passwordFromEnv, -1) . "'\n";
} else {
    echo "   ❌ env('MAIL_PASSWORD') returned empty/null\n";
}

echo "\n";

// Check config() function
echo "3. Reading via config() function (from cache):\n";
$mailConfig = config('mail.mailers.smtp');
if (isset($mailConfig['password'])) {
    $passwordFromConfig = $mailConfig['password'];
    if ($passwordFromConfig) {
        echo "   Password from config(): " . substr($passwordFromConfig, 0, 1) . str_repeat('*', strlen($passwordFromConfig) - 2) . substr($passwordFromConfig, -1) . "\n";
        echo "   Password length: " . strlen($passwordFromConfig) . " characters\n";
        echo "   First char: '" . substr($passwordFromConfig, 0, 1) . "'\n";
        echo "   Last char: '" . substr($passwordFromConfig, -1) . "'\n";
    } else {
        echo "   ❌ config('mail.mailers.smtp.password') is empty\n";
    }
} else {
    echo "   ❌ config('mail.mailers.smtp.password') not found\n";
}

echo "\n";

// Compare
echo "4. Comparison:\n";
$envDirect = preg_match('/^MAIL_PASSWORD=(.+)$/m', $envFile, $matches) ? trim($matches[1], '"\'') : null;
$envFunction = env('MAIL_PASSWORD');
$configValue = config('mail.mailers.smtp.password') ?? null;

if ($envDirect && $envFunction && $configValue) {
    if ($envDirect === $envFunction && $envFunction === $configValue) {
        echo "   ✅ All three methods return the same password\n";
    } else {
        echo "   ❌ Passwords don't match!\n";
        echo "   .env direct: " . ($envDirect ? "Set" : "Empty") . "\n";
        echo "   env() function: " . ($envFunction ? "Set" : "Empty") . "\n";
        echo "   config() function: " . ($configValue ? "Set" : "Empty") . "\n";
    }
} else {
    echo "   ⚠️  Some values are missing\n";
    echo "   .env direct: " . ($envDirect ? "Set" : "Empty") . "\n";
    echo "   env() function: " . ($envFunction ? "Set" : "Empty") . "\n";
    echo "   config() function: " . ($configValue ? "Set" : "Empty") . "\n";
}

echo "\n";
echo "=== Next step ===\n";
echo "Compare MAIL_PASSWORD in .env with the password shown in Hostinger → Email → Manage account → password / app password.\n";
echo "Do not commit real passwords to git.\n\n";

