# PowerShell Script: Configure SMTP for OTP System
# Run this script after you get SMTP credentials from Hostinger

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SMTP Configuration for OTP System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please make sure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Please enter your SMTP credentials:" -ForegroundColor Yellow
Write-Host ""

# Get SMTP credentials from user
$smtpHost = Read-Host "SMTP Host (e.g., smtp.hostinger.com)"
$smtpPort = Read-Host "SMTP Port (465 for SSL, 587 for TLS)"
$smtpUsername = Read-Host "Email Address (e.g., noreply@ebyapar.com)"
$smtpPassword = Read-Host "Email Password" -AsSecureString
$smtpEncryption = if ($smtpPort -eq "465") { "ssl" } else { "tls" }
$fromAddress = Read-Host "From Email Address (e.g., noreply@ebyapar.com)"
$fromName = Read-Host "From Name (e.g., Ebyapar)" -Default "Ebyapar"

# Convert secure string to plain text
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Updating .env file..." -ForegroundColor Green

# Read .env file
$envContent = Get-Content ".env" -Raw

# Function to update or add environment variable
function Update-EnvVariable {
    param(
        [string]$Key,
        [string]$Value,
        [string]$Content
    )
    
    $pattern = "^$Key=.*$"
    $newLine = "$Key=$Value"
    
    if ($Content -match "(?m)^$Key=.*$") {
        # Replace existing line
        return $Content -replace $pattern, $newLine
    } else {
        # Add new line
        return $Content + "`n$newLine"
    }
}

# Update mail configuration
$envContent = Update-EnvVariable -Key "MAIL_MAILER" -Value "smtp" -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_HOST" -Value $smtpHost -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_PORT" -Value $smtpPort -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_USERNAME" -Value $smtpUsername -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_PASSWORD" -Value $plainPassword -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_ENCRYPTION" -Value $smtpEncryption -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_FROM_ADDRESS" -Value $fromAddress -Content $envContent
$envContent = Update-EnvVariable -Key "MAIL_FROM_NAME" -Value "`"$fromName`"" -Content $envContent

# Write updated content back to .env
$envContent | Set-Content ".env" -NoNewline

Write-Host "✓ .env file updated successfully!" -ForegroundColor Green
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
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test email sending: php artisan tinker" -ForegroundColor White
Write-Host "2. Then run: Mail::raw('Test', function(`$m) { `$m->to('your-email@gmail.com')->subject('Test'); });" -ForegroundColor White
Write-Host "3. Check your email inbox!" -ForegroundColor White
Write-Host ""
Write-Host "Or test OTP registration directly in your application." -ForegroundColor White
Write-Host ""








