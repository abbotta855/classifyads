# Simple script to update .env with SMTP settings
$envFile = ".env"
$content = Get-Content $envFile -Raw

# Update or add each variable
$vars = @{
    "MAIL_MAILER" = "smtp"
    "MAIL_HOST" = "smtp.hostinger.com"
    "MAIL_PORT" = "465"
    "MAIL_USERNAME" = "contact@ebyapar.com"
    "MAIL_PASSWORD" = "teakendrajhuka@1234"
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


