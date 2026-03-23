# Update .env with SMTP settings (password prompted — do not hardcode secrets in git)
$envFile = ".env"
$content = Get-Content $envFile -Raw

$mailPassword = Read-Host "Enter MAIL_PASSWORD (Hostinger mailbox password)"
if ([string]::IsNullOrWhiteSpace($mailPassword)) {
    Write-Host "MAIL_PASSWORD empty — aborting." -ForegroundColor Red
    exit 1
}

# Update or add each variable
$vars = @{
    "MAIL_MAILER" = "smtp"
    "MAIL_HOST" = "smtp.hostinger.com"
    "MAIL_PORT" = "465"
    "MAIL_USERNAME" = "contact@ebyapar.com"
    "MAIL_PASSWORD" = $mailPassword
    "MAIL_ENCRYPTION" = "ssl"
    "MAIL_FROM_ADDRESS" = "contact@ebyapar.com"
    "MAIL_FROM_NAME" = '"Ebyapar"'
    "ADMIN_EMAIL" = "contact@ebyapar.com"
}

foreach ($key in $vars.Keys) {
    $value = $vars[$key]
    $pattern = "(?m)^$key=.*$"
    $newLine = "$key=$value"
    
    if ($content -match $pattern) {
        $content = $content -replace $pattern, $newLine
    } else {
        if ($content -notmatch "`n$") {
            $content += "`n"
        }
        $content += "$newLine`n"
    }
}

Set-Content $envFile -Value $content -NoNewline
Write-Host "SMTP configuration updated successfully!" -ForegroundColor Green


