# PowerShell Script: Auto-configure Hostinger SMTP for OTP System
# This script automatically configures .env with Hostinger SMTP credentials

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Hostinger SMTP Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please make sure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

# Hostinger SMTP Configuration
$smtpHost = "smtp.hostinger.com"
$smtpPort = "465"
$smtpUsername = "contact@ebyapar.com"
$smtpPassword = "teakendrajhuka@1234"
$smtpEncryption = "ssl"
$fromAddress = "contact@ebyapar.com"
$fromName = "Ebyapar"
$adminEmail = "contact@ebyapar.com"

Write-Host "Configuring SMTP with:" -ForegroundColor Yellow
Write-Host "  Host: $smtpHost" -ForegroundColor White
Write-Host "  Port: $smtpPort" -ForegroundColor White
Write-Host "  Username: $smtpUsername" -ForegroundColor White
Write-Host "  Encryption: $smtpEncryption" -ForegroundColor White
Write-Host "  From Address: $fromAddress" -ForegroundColor White
Write-Host "  Admin Email: $adminEmail" -ForegroundColor White
Write-Host ""

# Read .env file
$envContent = Get-Content ".env" -Raw

# Function to update or add environment variable
function Update-EnvVariable {
    param(
        [string]$Key,
        [string]$Value,
        [string]$Content
    )
    
    $pattern = "(?m)^$Key=.*$"
    $newLine = "$Key=$Value"
    
    if ($Content -match $pattern) {
        # Replace existing line
        return $Content -replace $pattern, $newLine
    } else {
        # Add new line at the end
        if ($Content -notmatch "`n$") {
            $Content += "`n"
        }
        return $Content + "$newLine`n"
    }
}

Write-Host "Updating .env file..." -ForegroundColor Green

# Update mail configuration
$envContent = Update-EnvVariable -Key "MAIL_MAILER" -Value "smtp" -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_HOST" -Value $smtpHost -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_PORT" -Value $smtpPort -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_USERNAME" -Value $smtpUsername -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_PASSWORD" -Value $smtpPassword -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_ENCRYPTION" -Value $smtpEncryption -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_FROM_ADDRESS" -Value $fromAddress -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_FROM_NAME" -Value "`"$fromName`"" -Content $envContent
$envContent = Update-EnvVariable -Key "ADMIN_EMAIL" -Value $adminEmail -Content $envContent

# Write updated content back to .env
$envContent | Set-Content ".env" -NoNewline

Write-Host "[OK] .env file updated successfully!" -ForegroundColor Green
Write-Host ""

# Clear Laravel config cache
Write-Host "Clearing Laravel config cache..." -ForegroundColor Yellow
php artisan config:clear
php artisan cache:clear

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host 'Email functionality configured:' -ForegroundColor Yellow
Write-Host '  [OK] OTP emails (user registration)' -ForegroundColor Green
Write-Host '  [OK] Password reset emails' -ForegroundColor Green
Write-Host '  [OK] Contact form notifications' -ForegroundColor Green
Write-Host '  [OK] Support chat replies' -ForegroundColor Green
Write-Host ""
Write-Host 'Next steps:' -ForegroundColor Yellow
Write-Host '1. Test OTP: Register a new user and check email' -ForegroundColor White
Write-Host '2. Test password reset: Use forgot password feature' -ForegroundColor White
Write-Host '3. Test contact form: Submit a message via contact page' -ForegroundColor White
Write-Host ""
Write-Host 'Note: Make sure DNS records (MX, SPF, DKIM) are configured on Cloudflare' -ForegroundColor Cyan
Write-Host ""

