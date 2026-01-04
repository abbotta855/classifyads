# M6 Verification Script
# Run this script to verify M6 implementation

Write-Host ""
Write-Host "=== M6 (Wallet & Chat System) Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check if files exist
Write-Host "1. Checking Backend Files..." -ForegroundColor Yellow
$files = @(
    "app\Services\WalletService.php",
    "app\Http\Controllers\WalletController.php",
    "app\Http\Controllers\Admin\WalletController.php"
)

$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "   [MISSING] $file" -ForegroundColor Red
        $allExist = $false
    }
}

# Check routes
Write-Host ""
Write-Host "2. Checking Routes..." -ForegroundColor Yellow
$routes = php artisan route:list --path=wallet 2>&1
if ($routes -match "wallet") {
    Write-Host "   [OK] Wallet routes registered" -ForegroundColor Green
    $routeCount = ($routes | Select-String "wallet").Count
    Write-Host "   Found $routeCount wallet routes" -ForegroundColor Cyan
} else {
    Write-Host "   [ERROR] Wallet routes not found" -ForegroundColor Red
    $allExist = $false
}

# Check frontend API
Write-Host ""
Write-Host "3. Checking Frontend API..." -ForegroundColor Yellow
if (Test-Path "resources\js\utils\api.js") {
    $apiContent = Get-Content "resources\js\utils\api.js" -Raw
    if ($apiContent -match "walletAPI") {
        Write-Host "   [OK] walletAPI found in api.js" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] walletAPI not found" -ForegroundColor Red
        $allExist = $false
    }
} else {
    Write-Host "   [ERROR] api.js not found" -ForegroundColor Red
    $allExist = $false
}

# Check UserDashboard import
Write-Host ""
Write-Host "4. Checking Frontend Components..." -ForegroundColor Yellow
if (Test-Path "resources\js\components\UserDashboard.jsx") {
    $dashboardContent = Get-Content "resources\js\components\UserDashboard.jsx" -Raw
    if ($dashboardContent -match "walletAPI") {
        Write-Host "   [OK] walletAPI imported in UserDashboard.jsx" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] walletAPI not imported" -ForegroundColor Red
        $allExist = $false
    }
    
    if ($dashboardContent -match "Add Funds" -and $dashboardContent -notmatch "Coming Soon") {
        Write-Host "   [OK] Add Funds button enabled" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Add Funds button may still show Coming Soon" -ForegroundColor Yellow
    }
    
    if ($dashboardContent -match "Withdraw" -and $dashboardContent -notmatch "Coming Soon") {
        Write-Host "   [OK] Withdraw button enabled" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Withdraw button may still show Coming Soon" -ForegroundColor Yellow
    }
} else {
    Write-Host "   [ERROR] UserDashboard.jsx not found" -ForegroundColor Red
    $allExist = $false
}

# Summary
Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
if ($allExist) {
    Write-Host "[SUCCESS] All core files and routes are in place!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Start the application (npm run dev + php artisan serve)" -ForegroundColor White
    Write-Host "2. Login as a user and navigate to E-Wallet section" -ForegroundColor White
    Write-Host "3. Test Add Funds and Withdraw functionality" -ForegroundColor White
    Write-Host "4. Check balance calculation in Dashboard stats" -ForegroundColor White
    Write-Host ""
    Write-Host "See M6_TESTING_GUIDE.md for detailed testing instructions" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Some files or routes are missing. Please check the errors above." -ForegroundColor Red
}

Write-Host ""
