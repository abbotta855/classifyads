<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Reply</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #0066cc; margin-top: 0;">Support Team Reply</h2>
    </div>

    @if(isset($guestName) && $guestName)
        <p>Hello {{ $guestName }},</p>
    @else
        <p>Hello,</p>
    @endif

    <p>Thank you for contacting our support team. We have received your message and are responding below:</p>

    <div style="background-color: #f1f1f1; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
        <strong>Your original message:</strong>
        <p style="margin: 10px 0 0 0;">{{ $originalMessage ?? 'N/A' }}</p>
    </div>

    <div style="background-color: #e8f4f8; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
        <strong>Our reply:</strong>
        <p style="margin: 10px 0 0 0;">{{ $replyMessage ?? 'N/A' }}</p>
    </div>

    <p>If you have any further questions, please don't hesitate to reach out to us.</p>

    <p>Best regards,<br>
    Support Team</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="font-size: 12px; color: #666; margin: 0;">
        This is an automated email. Please do not reply directly to this message.
    </p>
</body>
</html>

