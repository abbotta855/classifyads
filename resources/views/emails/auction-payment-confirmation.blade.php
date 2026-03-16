<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $isBuyer ? 'Payment Confirmation' : 'Payment Received' }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
        <h2 style="color: #2563eb; margin-top: 0;">
            {{ $isBuyer ? '✅ Payment Confirmation' : '💰 Payment Received' }}
        </h2>
        
        <p>Hello {{ $isBuyer ? ($transaction->user->name ?? 'User') : ($auction->user->name ?? 'Seller') }},</p>
        
        @php
            $user = $isBuyer ? $transaction->user : $auction->user;
        @endphp
        
        @if($isBuyer)
            <p>Your payment for the auction has been successfully processed!</p>
        @else
            <p>You have received payment for your auction!</p>
        @endif
        
        <div style="background-color: #ffffff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #2563eb;">Auction Details</h3>
            <p><strong>Title:</strong> {{ $auction->title }}</p>
            <p><strong>Amount Paid:</strong> Rs. {{ number_format($transaction->amount, 2) }}</p>
            <p><strong>Transaction ID:</strong> {{ $transaction->payment_id }}</p>
            <p><strong>Payment Date:</strong> {{ $transaction->updated_at->format('F d, Y h:i A') }}</p>
        </div>
        
        @if($isBuyer)
            <p>You can now view your purchase details in your dashboard.</p>
            <p style="margin: 20px 0;">
                <a href="{{ config('app.url') }}/auctions/{{ $auction->id }}" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    View Auction
                </a>
            </p>
        @else
            <p>Your auction has been completed and payment has been received. Thank you for using our platform!</p>
        @endif
        
        <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Best regards,<br>
            {{ config('app.name') }} Team
        </p>
    </div>
</body>
</html>

