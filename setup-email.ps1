# Quick Email Setup Script
# This script helps you set up email for OTP system

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OTP Email Setup Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Current mail driver: " -NoNewline
$currentDriver = php artisan tinker --execute="echo config('mail.default');" 2>$null
Write-Host $currentDriver -ForegroundColor Yellow

Write-Host ""
Write-Host "Choose an option:" -ForegroundColor Green
Write-Host "1. Mailtrap (Recommended for testing - FREE)" -ForegroundColor White
Write-Host "2. Gmail SMTP" -ForegroundColor White
Write-Host "3. Check current OTP codes in logs" -ForegroundColor White
Write-Host "4. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "Mailtrap Setup:" -ForegroundColor Cyan
    Write-Host "1. Go to https://mailtrap.io and sign up (free)" -ForegroundColor Yellow
    Write-Host "2. Create an inbox" -ForegroundColor Yellow
    Write-Host "3. Copy your SMTP credentials" -ForegroundColor Yellow
    Write-Host ""
    $username = Read-Host "Enter Mailtrap Username"
    $password = Read-Host "Enter Mailtrap Password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    
    Write-Host ""
    Write-Host "Updating .env file..." -ForegroundColor Green
    
    # Read .env file
    $envContent = Get-Content .env -Raw
    
    # Update mail settings
    $envContent = $envContent -replace 'MAIL_MAILER=.*', 'MAIL_MAILER=smtp'
    $envContent = $envContent -replace 'MAIL_HOST=.*', 'MAIL_HOST=smtp.mailtrap.io'
    $envContent = $envContent -replace 'MAIL_PORT=.*', 'MAIL_PORT=2525'
    $envContent = $envContent -replace 'MAIL_USERNAME=.*', "MAIL_USERNAME=$username"
    $envContent = $envContent -replace 'MAIL_PASSWORD=.*', "MAIL_PASSWORD=$passwordPlain"
    $envContent = $envContent -replace 'MAIL_ENCRYPTION=.*', 'MAIL_ENCRYPTION=tls'
    
    # Add if not exists
    if ($envContent -notmatch 'MAIL_MAILER=') {
        $envContent += "`nMAIL_MAILER=smtp`nMAIL_HOST=smtp.mailtrap.io`nMAIL_PORT=2525`nMAIL_USERNAME=$username`nMAIL_PASSWORD=$passwordPlain`nMAIL_ENCRYPTION=tls`n"
    }
    
    Set-Content .env $envContent
    
    Write-Host "Clearing config cache..." -ForegroundColor Green
    php artisan config:clear
    
    Write-Host ""
    Write-Host "✅ Email configured! Try registering a new user now." -ForegroundColor Green
    Write-Host "   Check your Mailtrap inbox for the OTP email." -ForegroundColor Yellow
    
} elseif ($choice -eq "2") {
    Write-Host ""
    Write-Host "Gmail SMTP Setup:" -ForegroundColor Cyan
    Write-Host "1. Enable 2FA on your Gmail account" -ForegroundColor Yellow
    Write-Host "2. Generate App Password: https://myaccount.google.com/apppasswords" -ForegroundColor Yellow
    Write-Host ""
    $email = Read-Host "Enter your Gmail address"
    $appPassword = Read-Host "Enter your Gmail App Password" -AsSecureString
    $appPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($appPassword))
    
    Write-Host ""
    Write-Host "Updating .env file..." -ForegroundColor Green
    
    # Read .env file
    $envContent = Get-Content .env -Raw
    
    # Update mail settings
    $envContent = $envContent -replace 'MAIL_MAILER=.*', 'MAIL_MAILER=smtp'
    $envContent = $envContent -replace 'MAIL_HOST=.*', 'MAIL_HOST=smtp.gmail.com'
    $envContent = $envContent -replace 'MAIL_PORT=.*', 'MAIL_PORT=587'
    $envContent = $envContent -replace 'MAIL_USERNAME=.*', "MAIL_USERNAME=$email"
    $envContent = $envContent -replace 'MAIL_PASSWORD=.*', "MAIL_PASSWORD=$appPasswordPlain"
    $envContent = $envContent -replace 'MAIL_ENCRYPTION=.*', 'MAIL_ENCRYPTION=tls'
    $envContent = $envContent -replace 'MAIL_FROM_ADDRESS=.*', "MAIL_FROM_ADDRESS=$email"
    
    # Add if not exists
    if ($envContent -notmatch 'MAIL_MAILER=') {
        $envContent += "`nMAIL_MAILER=smtp`nMAIL_HOST=smtp.gmail.com`nMAIL_PORT=587`nMAIL_USERNAME=$email`nMAIL_PASSWORD=$appPasswordPlain`nMAIL_ENCRYPTION=tls`nMAIL_FROM_ADDRESS=$email`n"
    }
    
    Set-Content .env $envContent
    
    Write-Host "Clearing config cache..." -ForegroundColor Green
    php artisan config:clear
    
    Write-Host ""
    Write-Host "✅ Email configured! Try registering a new user now." -ForegroundColor Green
    
} elseif ($choice -eq "3") {
    Write-Host ""
    Write-Host "Recent OTP codes from logs:" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Get-Content storage/logs/laravel.log -Tail 500 | Select-String -Pattern "[0-9]{6}" | Select-Object -Last 5 | ForEach-Object {
        Write-Host $_.Line -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Note: These are logged because mail driver is set to 'log'" -ForegroundColor Yellow
    Write-Host "      Set up email (option 1 or 2) to actually send emails." -ForegroundColor Yellow
} else {
    Write-Host "Exiting..." -ForegroundColor Gray
}

Write-Host ""

