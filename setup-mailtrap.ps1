# Mailtrap Email Setup Script
# This script configures Mailtrap for OTP email testing

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Mailtrap Email Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Current mail driver: " -NoNewline
try {
    $currentDriver = php artisan tinker --execute="echo config('mail.default');" 2>$null
    Write-Host $currentDriver -ForegroundColor Yellow
} catch {
    Write-Host "unknown" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Follow these steps:" -ForegroundColor Green
Write-Host "1. Go to https://mailtrap.io and sign up/login" -ForegroundColor White
Write-Host "2. Create an inbox" -ForegroundColor White
Write-Host "3. Go to SMTP Settings → Select 'Laravel'" -ForegroundColor White
Write-Host "4. Copy your Username and Password" -ForegroundColor White
Write-Host ""

$username = Read-Host "Enter your Mailtrap Username"
if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "Username cannot be empty. Exiting..." -ForegroundColor Red
    exit
}

$password = Read-Host "Enter your Mailtrap Password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

if ([string]::IsNullOrWhiteSpace($passwordPlain)) {
    Write-Host "Password cannot be empty. Exiting..." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Configuring .env file..." -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file first (copy from .env.example)" -ForegroundColor Yellow
    exit
}

# Read .env file
$envContent = Get-Content .env -Raw

# Function to update or add env variable
function Update-EnvVariable {
    param($content, $key, $value)
    $pattern = "^$key=.*"
    if ($content -match $pattern) {
        return $content -replace $pattern, "$key=$value"
    } else {
        return $content + "`n$key=$value"
    }
}

# Update mail settings
$envContent = Update-EnvVariable $envContent "MAIL_MAILER" "smtp"
$envContent = Update-EnvVariable $envContent "MAIL_HOST" "smtp.mailtrap.io"
$envContent = Update-EnvVariable $envContent "MAIL_PORT" "2525"
$envContent = Update-EnvVariable $envContent "MAIL_USERNAME" $username
$envContent = Update-EnvVariable $envContent "MAIL_PASSWORD" $passwordPlain
$envContent = Update-EnvVariable $envContent "MAIL_ENCRYPTION" "tls"

# Set default FROM address if not set
if ($envContent -notmatch 'MAIL_FROM_ADDRESS=') {
    $envContent += "`nMAIL_FROM_ADDRESS=noreply@yourdomain.com`n"
}
if ($envContent -notmatch 'MAIL_FROM_NAME=') {
    $envContent += "`nMAIL_FROM_NAME=`"${env:APP_NAME}`"`n"
}

# Write back to .env
Set-Content .env $envContent -NoNewline

Write-Host "✅ .env file updated!" -ForegroundColor Green
Write-Host ""
Write-Host "Clearing Laravel config cache..." -ForegroundColor Green
php artisan config:clear

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Mailtrap Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Try registering a new user" -ForegroundColor White
Write-Host "2. Check your Mailtrap inbox for the OTP email" -ForegroundColor White
Write-Host "3. The email will appear in Mailtrap, not in your real inbox" -ForegroundColor White
Write-Host ""
Write-Host "Your Mailtrap inbox: https://mailtrap.io/inboxes" -ForegroundColor Cyan
Write-Host ""

