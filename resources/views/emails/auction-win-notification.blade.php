<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Congratulations! You Won the Auction</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #10b981; margin-top: 0;">🎉 Congratulations! You Won!</h2>
        
        <p>Hello {{ $auction->winner ? $auction->winner->name : 'User' }},</p>
        
        <p>Great news! You have won the auction for:</p>
        
        <div style="background-color: #ffffff; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #10b981;">{{ $auction->title }}</h3>
            <p><strong>Winning Bid:</strong> Rs. {{ number_format($auction->current_bid_price ?? $auction->starting_price, 2) }}</p>
            @if($winningBid)
                <p><strong>Your Bid Amount:</strong> Rs. {{ number_format($winningBid->bid_amount, 2) }}</p>
            @endif
            <p><strong>Auction Ended:</strong> {{ $auction->end_time->format('F d, Y h:i A') }}</p>
        </div>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Important:</strong> Please complete your payment to claim your item.</p>
        </div>
        
        <p style="margin: 20px 0;">
            <a href="{{ config('app.url') }}/auctions/{{ $auction->id }}" 
               style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Complete Payment Now
            </a>
        </p>
        
        <p>You can also view this auction in your dashboard under "Won Auctions".</p>
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Best regards,<br>
            {{ config('app.name') }} Team
        </p>
    </div>
</body>
</html>

