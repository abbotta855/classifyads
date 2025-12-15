<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\User;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SellerVerificationController extends Controller
{
    protected PayPalService $paypalService;

    public function __construct(PayPalService $paypalService)
    {
        $this->paypalService = $paypalService;
    }

    /**
     * Initiate PayPal payment for seller verification fee.
     */
    public function initiatePayment(Request $request)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        if ($user->seller_verified) {
            return response()->json(['error' => 'You are already a verified seller'], 400);
        }

        // Verification fee in platform currency (mapped to USD for PayPal)
        $fee = (float) config('app.seller_verification_fee', 10.0);

        $items = [
            [
                'name' => 'Seller Verification Fee',
                'description' => 'Account verification to enable eBook selling',
                'quantity' => '1',
                'unit_amount' => [
                    'currency_code' => 'USD',
                    'value' => number_format($fee, 2, '.', ''),
                ],
            ],
        ];

        // Create order with custom return URLs for seller verification
        $order = $this->paypalService->createOrder(
            $fee, 
            'USD', 
            $items,
            config('app.url') . '/api/seller-verification/payment/success',
            config('app.url') . '/api/seller-verification/payment/cancel'
        );

        if (!$order) {
            // Check if PayPal credentials are configured
            $clientId = config('services.paypal.client_id');
            $clientSecret = config('services.paypal.client_secret');
            
            if (!$clientId || !$clientSecret) {
                return response()->json([
                    'error' => 'PayPal credentials are not configured on the server. Please contact the administrator to set up PayPal sandbox credentials in the .env file (PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET).'
                ], 500);
            }
            
            return response()->json([
                'error' => 'Failed to create PayPal order. Please check server logs for details.'
            ], 500);
        }

        // Create pending transaction
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'type' => 'seller_verification',
            'amount' => $fee,
            'status' => 'pending',
            'payment_method' => 'paypal',
            'payment_id' => $order['id'],
            'description' => 'Seller verification fee',
        ]);

        $approvalUrl = collect($order['links'])->firstWhere('rel', 'approve')['href'] ?? null;

        return response()->json([
            'order_id' => $order['id'],
            'approval_url' => $approvalUrl,
            'transaction_id' => $transaction->id,
        ]);
    }

    /**
     * Handle successful seller verification payment.
     */
    public function paymentSuccess(Request $request)
    {
        $orderId = $request->input('token') ?? $request->input('order_id');

        if (!$orderId) {
            return redirect('/user_dashboard/e-wallet?seller_verification=error&message=' . urlencode('Payment verification failed'));
        }

        $capture = $this->paypalService->captureOrder($orderId);

        if (!$capture || $capture['status'] !== 'COMPLETED') {
            return redirect('/user_dashboard/e-wallet?seller_verification=error&message=' . urlencode('Payment capture failed'));
        }

        $transaction = Transaction::where('payment_id', $orderId)
            ->where('status', 'pending')
            ->where('type', 'seller_verification')
            ->first();

        if (!$transaction) {
            return redirect('/user_dashboard/e-wallet?seller_verification=error&message=' . urlencode('Transaction not found'));
        }

        $transaction->update([
            'status' => 'completed',
        ]);

        /** @var User $user */
        $user = $transaction->user;

        $user->update([
            'seller_verified' => true,
            'seller_verification_fee_paid' => true,
            'seller_verification_payment_id' => $orderId,
            'seller_verification_payment_method' => 'paypal',
            'seller_verified_at' => now(),
        ]);

        return redirect('/user_dashboard/e-wallet?seller_verification=success');
    }

    /**
     * Handle cancelled seller verification payment.
     */
    public function paymentCancel()
    {
        return redirect('/user_dashboard/e-wallet?seller_verification=cancelled');
    }
}


