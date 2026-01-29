<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $status === 'approved' ? 'Product Approved' : 'Product Status Update' }}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">{{ config('app.name') }}</h1>
    </div>
    
    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        @if($status === 'approved')
            <h2 style="color: #28a745; margin-top: 0;">🎉 Congratulations! Your Product Has Been Approved</h2>
            <p>Hello {{ $product->user->name }},</p>
            <p>Great news! Your Nepali product "<strong>{{ $product->title }}</strong>" has been approved and is now live on our platform.</p>
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
                <p style="margin: 0;"><strong>Product:</strong> {{ $product->title }}</p>
                <p style="margin: 5px 0;"><strong>Company:</strong> {{ $product->company_name }}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Approved ✓</span></p>
            </div>
            <p>Your product is now visible to all users. You can view it by clicking the link below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ url('/nepali-products/' . ($product->slug ?? $product->id)) }}" 
                   style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    View Your Product
                </a>
            </div>
        @elseif($status === 'rejected')
            <h2 style="color: #dc3545; margin-top: 0;">Product Submission Update</h2>
            <p>Hello {{ $product->user->name }},</p>
            <p>We regret to inform you that your Nepali product "<strong>{{ $product->title }}</strong>" could not be approved at this time.</p>
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <p style="margin: 0;"><strong>Product:</strong> {{ $product->title }}</p>
                <p style="margin: 5px 0;"><strong>Company:</strong> {{ $product->company_name }}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">Rejected</span></p>
                @if($reason)
                    <p style="margin: 10px 0 0 0;"><strong>Reason:</strong> {{ $reason }}</p>
                @endif
            </div>
            <p>Please review your product information and make any necessary corrections. You can edit and resubmit your product.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ url('/nepali-products/' . ($product->id ?? '') . '/edit') }}" 
                   style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Edit Your Product
                </a>
            </div>
        @endif
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
            If you have any questions, please don't hesitate to contact our support team.
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Best regards,<br>
            The {{ config('app.name') }} Team
        </p>
    </div>
</body>
</html>

