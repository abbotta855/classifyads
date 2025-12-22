<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #f59e0b; margin-top: 0;">⏰ Payment Reminder</h2>
        
        <p>Hello {{ $auction->winner ? $auction->winner->name : 'User' }},</p>
        
        <p>This is a friendly reminder that you have {{ $daysRemaining }} day(s) remaining to complete payment for the auction you won:</p>
        
        <div style="background-color: #ffffff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #2563eb;">{{ $auction->title }}</h3>
            <p><strong>Amount to Pay:</strong> Rs. {{ number_format($auction->current_bid_price ?? $auction->starting_price, 2) }}</p>
            <p><strong>Auction Ended:</strong> {{ $auction->end_time->format('F d, Y h:i A') }}</p>
        </div>
        
        @if($daysRemaining <= 1)
            <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>⚠️ Urgent:</strong> Please complete your payment soon to avoid cancellation.</p>
            </div>
        @endif
        
        <p style="margin: 20px 0;">
            <a href="{{ config('app.url') }}/auctions/{{ $auction->id }}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Pay Now
            </a>
        </p>
        
        <p>If you have already made the payment, please ignore this email.</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Best regards,<br>
            {{ config('app.name') }} Team
        </p>
    </div>
</body>
</html>

