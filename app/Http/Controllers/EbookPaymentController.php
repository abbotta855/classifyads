<?php

namespace App\Http\Controllers;

use App\Models\Ebook;
use App\Models\Transaction;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class EbookPaymentController extends Controller
{
    protected PayPalService $paypalService;

    public function __construct(PayPalService $paypalService)
    {
        $this->paypalService = $paypalService;
    }

    /**
     * Initiate PayPal payment for eBook purchase
     */
    public function initiatePayment(Request $request, string $ebookId)
    {
        $ebook = Ebook::findOrFail($ebookId);

        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        // Check if user already purchased this eBook
        if ($ebook->isPurchasedBy(Auth::id())) {
            return response()->json(['error' => 'You have already purchased this eBook'], 400);
        }

        // Create PayPal order
        $items = [
            [
                'name' => $ebook->title,
                'description' => substr($ebook->description ?? '', 0, 127),
                'quantity' => '1',
                'unit_amount' => [
                    'currency_code' => 'USD',
                    'value' => number_format($ebook->price, 2, '.', ''),
                ],
            ],
        ];

        $order = $this->paypalService->createOrder($ebook->price, 'USD', $items);

        if (!$order) {
            return response()->json(['error' => 'Failed to create PayPal order'], 500);
        }

        // Create pending transaction
        $transaction = Transaction::create([
            'user_id' => Auth::id(),
            'type' => 'ebook_purchase',
            'amount' => $ebook->price,
            'status' => 'pending',
            'payment_method' => 'paypal',
            'payment_id' => $order['id'],
            'description' => "Purchase: {$ebook->title}",
            'ebook_id' => $ebook->id,
        ]);

        // Return approval URL
        $approvalUrl = collect($order['links'])->firstWhere('rel', 'approve')['href'] ?? null;

        return response()->json([
            'order_id' => $order['id'],
            'approval_url' => $approvalUrl,
            'transaction_id' => $transaction->id,
        ]);
    }

    /**
     * Handle successful payment
     */
    public function paymentSuccess(Request $request)
    {
        $orderId = $request->input('token') ?? $request->input('order_id');

        if (!$orderId) {
            return redirect('/ebooks?payment=error&message=' . urlencode('Payment verification failed'));
        }

        // Capture the order
        $capture = $this->paypalService->captureOrder($orderId);

        if (!$capture || $capture['status'] !== 'COMPLETED') {
            return redirect('/ebooks?payment=error&message=' . urlencode('Payment capture failed'));
        }

        // Find transaction by payment_id
        $transaction = Transaction::where('payment_id', $orderId)
            ->where('status', 'pending')
            ->first();

        if (!$transaction) {
            return redirect('/ebooks?payment=error&message=' . urlencode('Transaction not found'));
        }

        // Generate verification code
        $verificationCode = strtoupper(Str::random(12));

        // Update transaction
        $transaction->update([
            'status' => 'completed',
            'verification_code' => $verificationCode,
        ]);

        // Increment purchase count
        $transaction->ebook->increment('purchase_count');

        return redirect('/ebooks/' . $transaction->ebook_id . '?payment=success&code=' . urlencode($verificationCode));
    }

    /**
     * Handle cancelled payment
     */
    public function paymentCancel()
    {
        return redirect('/ebooks?payment=cancelled');
    }

    /**
     * PayPal webhook handler
     */
    public function webhook(Request $request)
    {
        // Verify webhook signature (implement based on PayPal documentation)
        // For now, we'll handle it manually via paymentSuccess
        
        $eventType = $request->input('event_type');
        $resource = $request->input('resource');

        if ($eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            $orderId = $resource['supplementary_data']['related_ids']['order_id'] ?? null;

            if ($orderId) {
                $transaction = Transaction::where('payment_id', $orderId)
                    ->where('status', 'pending')
                    ->first();

                if ($transaction) {
                    $verificationCode = strtoupper(Str::random(12));
                    $transaction->update([
                        'status' => 'completed',
                        'verification_code' => $verificationCode,
                    ]);
                    $transaction->ebook->increment('purchase_count');
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }
}
