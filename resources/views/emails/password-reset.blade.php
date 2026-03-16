<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2563eb; margin-top: 0;">Reset Your Password</h2>
        
        <p>Hello {{ $userName }},</p>
        
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $resetUrl }}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
            </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #2563eb; background-color: #f0f0f0; padding: 10px; border-radius: 3px;">
            {{ $resetUrl }}
        </p>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Important:</strong> This link will expire in 60 minutes. If you did not request a password reset, please ignore this email.</p>
        </div>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Best regards,<br>
            The Team
        </p>
    </div>
</body>
</html>

