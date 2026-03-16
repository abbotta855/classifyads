<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2563eb; margin-top: 0;">Email Verification</h2>
        
        <p>Hello {{ $userName }},</p>
        
        <p>Thank you for registering with us. Please use the following One-Time Password (OTP) to verify your email address:</p>
        
        <div style="background-color: #ffffff; border: 2px dashed #2563eb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px; margin: 0;">{{ $otpCode }}</h1>
        </div>
        
        <p><strong>This code will expire in 10 minutes.</strong></p>
        
        <p>If you did not request this code, please ignore this email.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Best regards,<br>
            The Team
        </p>
    </div>
</body>
</html>

