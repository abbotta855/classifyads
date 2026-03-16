<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Code</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2563eb; margin-top: 0;">Password Reset Request</h2>
        
        <p>Hello {{ $userName }},</p>
        
        <p>We received a request to reset your password. Please use the following code to reset your password:</p>
        
        <div style="background-color: #ffffff; border: 2px dashed #2563eb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px; margin: 0;">{{ $resetCode }}</h1>
        </div>
        
        <p><strong>This code will expire in 10 minutes.</strong></p>
        
        <p>Enter this code on the password reset page to unlock the password reset form.</p>
        
        <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Best regards,<br>
            The Ebyapar.com Team
        </p>
    </div>
</body>
</html>

