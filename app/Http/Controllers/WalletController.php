<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Services\WalletService;
use App\Services\PayPalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class WalletController extends Controller
{
    protected WalletService $walletService;
    protected PayPalService $paypalService;

    public function __construct(WalletService $walletService, PayPalService $paypalService)
    {
        $this->walletService = $walletService;
        $this->paypalService = $paypalService;
    }

    /**
     * Get wallet balance
     */
    public function getBalance(Request $request)
    {
        $user = $request->user();
        $balance = $this->walletService->calculateBalance($user->id);
        $availableBalance = $this->walletService->getAvailableBalance($user->id);

        return response()->json([
            'balance' => $balance,
            'available_balance' => $availableBalance,
        ]);
    }

    /**
     * Initiate PayPal deposit (Add Funds)
     */
    public function initiateDeposit(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1|max:10000',
            'paypal_email' => 'required|email|max:255',
        ]);

        $user = Auth::user();
        $amount = (float) $request->input('amount');
        $paypalEmail = $request->input('paypal_email');
        $demoMode = config('services.paypal.demo_mode', false);

        // Demo mode: Skip PayPal and create completed transaction directly
        if ($demoMode) {
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'type' => 'deposit',
                'amount' => $amount,
                'status' => 'completed',
                'payment_method' => 'demo',
                'payment_id' => 'DEMO-' . time() . '-' . $user->id,
                'paypal_email' => $paypalEmail,
                'description' => "Wallet Deposit (Demo Mode): $" . number_format($amount, 2) . " from PayPal: " . $paypalEmail,
            ]);

            return response()->json([
                'demo_mode' => true,
                'message' => 'Deposit completed successfully (Demo Mode)',
                'transaction_id' => $transaction->id,
            ]);
        }

        // Production mode: Use PayPal
        $items = [
            [
                'name' => 'Wallet Deposit',
                'description' => 'Add funds to wallet',
                'quantity' => '1',
                'unit_amount' => [
                    'currency_code' => 'USD',
                    'value' => number_format($amount, 2, '.', ''),
                ],
            ],
        ];

        $returnUrl = config('app.url') . '/api/wallet/deposit/success';
        $cancelUrl = config('app.url') . '/api/wallet/deposit/cancel';

        $order = $this->paypalService->createOrder($amount, 'USD', $items, $returnUrl, $cancelUrl);

        if (!$order) {
            // Check if PayPal credentials are configured
            $clientId = config('services.paypal.client_id');
            $clientSecret = config('services.paypal.client_secret');
            
            if (!$clientId || !$clientSecret) {
                return response()->json([
                    'error' => 'PayPal credentials not configured',
                    'message' => 'PayPal sandbox/client credentials must be configured on the server. Please contact the administrator.',
                ], 500);
            }
            
            return response()->json([
                'error' => 'Failed to create PayPal order',
                'message' => 'Unable to create PayPal order. Please try again later.',
            ], 500);
        }

        // Create pending transaction
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'type' => 'deposit',
            'amount' => $amount,
            'status' => 'pending',
            'payment_method' => 'paypal',
            'payment_id' => $order['id'],
            'paypal_email' => $paypalEmail,
            'description' => "Wallet Deposit: $" . number_format($amount, 2) . " from PayPal: " . $paypalEmail,
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
     * Handle successful deposit payment
     */
    public function depositSuccess(Request $request)
    {
        $orderId = $request->input('token') ?? $request->input('order_id');

        if (!$orderId) {
            return redirect('/user_dashboard/e-wallet?wallet=error&message=' . urlencode('Payment verification failed'));
        }

        // Capture the order
        $capture = $this->paypalService->captureOrder($orderId);

        if (!$capture || $capture['status'] !== 'COMPLETED') {
            return redirect('/user_dashboard/e-wallet?wallet=error&message=' . urlencode('Payment capture failed'));
        }

        // Find transaction by payment_id
        $transaction = Transaction::where('payment_id', $orderId)
            ->where('type', 'deposit')
            ->where('status', 'pending')
            ->first();

        if (!$transaction) {
            return redirect('/user_dashboard/e-wallet?wallet=error&message=' . urlencode('Transaction not found'));
        }

        // Update transaction status
        $transaction->update([
            'status' => 'completed',
        ]);

        return redirect('/user_dashboard/e-wallet?wallet=success&message=' . urlencode('Funds added successfully'));
    }

    /**
     * Handle cancelled deposit payment
     */
    public function depositCancel()
    {
        return redirect('/user_dashboard/e-wallet?wallet=cancelled&message=' . urlencode('Deposit was cancelled'));
    }

    /**
     * Request withdrawal (Only for verified sellers - Hybrid Approach)
     */
    public function requestWithdrawal(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'paypal_email' => 'required|email|max:255',
        ]);

        $user = Auth::user();
        
        // Hybrid Approach: Only verified sellers can withdraw
        if (!$user->seller_verified) {
            return response()->json([
                'error' => 'Seller verification required',
                'message' => 'You must be a verified seller to request withdrawals. Please verify your seller account first.',
            ], 403);
        }
        
        $amount = (float) $request->input('amount');
        $paypalEmail = $request->input('paypal_email');
        
        // Get withdrawal regulations from config
        $minAmount = (float) config('services.withdrawal.min_amount', 10.00);
        $maxAmount = (float) config('services.withdrawal.max_amount', 10000.00);
        $dailyLimit = (float) config('services.withdrawal.daily_limit', 50000.00);
        $dailyCountLimit = (int) config('services.withdrawal.daily_count_limit', 3);

        // Validate minimum amount
        if ($amount < $minAmount) {
            return response()->json([
                'error' => 'Validation failed',
                'message' => "Minimum withdrawal amount is $" . number_format($minAmount, 2),
            ], 422);
        }

        // Validate maximum amount
        if ($amount > $maxAmount) {
            return response()->json([
                'error' => 'Validation failed',
                'message' => "Maximum withdrawal amount per request is $" . number_format($maxAmount, 2),
            ], 422);
        }

        // Check available balance
        $availableBalance = $this->walletService->getAvailableBalance($user->id);
        
        if ($availableBalance < $amount) {
            return response()->json([
                'error' => 'Validation failed',
                'message' => 'Insufficient balance. Available balance: $' . number_format($availableBalance, 2),
            ], 422);
        }

        // Check daily withdrawal limit
        $todayWithdrawals = $this->walletService->getTodayWithdrawals($user->id);
        if (($todayWithdrawals + $amount) > $dailyLimit) {
            $remaining = $dailyLimit - $todayWithdrawals;
            return response()->json([
                'error' => 'Daily limit exceeded',
                'message' => "Daily withdrawal limit is $" . number_format($dailyLimit, 2) . ". You can withdraw up to $" . number_format($remaining, 2) . " more today.",
            ], 422);
        }

        // Check daily withdrawal count limit
        $todayCount = $this->walletService->getTodayWithdrawalCount($user->id);
        if ($todayCount >= $dailyCountLimit) {
            return response()->json([
                'error' => 'Daily limit exceeded',
                'message' => "You have reached the daily withdrawal limit of " . $dailyCountLimit . " withdrawal(s). Please try again tomorrow.",
            ], 422);
        }

        $demoMode = config('services.paypal.demo_mode', false);

        // Demo mode: Automatically complete withdrawal
        if ($demoMode) {
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'type' => 'withdraw',
                'amount' => $amount,
                'status' => 'completed',
                'payment_method' => 'demo',
                'payment_id' => 'DEMO-WITHDRAW-' . time() . '-' . $user->id,
                'paypal_email' => $paypalEmail,
                'description' => "Withdrawal (Demo Mode): $" . number_format($amount, 2) . " to PayPal: " . $paypalEmail,
            ]);

            Log::info('Withdrawal completed (Demo Mode)', [
                'transaction_id' => $transaction->id,
                'user_id' => $user->id,
                'amount' => $amount,
                'paypal_email' => $paypalEmail,
            ]);

            return response()->json([
                'demo_mode' => true,
                'message' => 'Withdrawal processed successfully (Demo Mode). Funds have been sent to your PayPal account.',
                'transaction_id' => $transaction->id,
            ]);
        }

        // Production mode: Process withdrawal automatically via PayPal Payouts API
        $payout = $this->paypalService->createPayout(
            $paypalEmail,
            $amount,
            'USD',
            "Withdrawal payment from " . config('app.name')
        );

        if (!$payout) {
            // Check if PayPal credentials are configured
            $clientId = config('services.paypal.client_id');
            $clientSecret = config('services.paypal.client_secret');
            
            if (!$clientId || !$clientSecret) {
                return response()->json([
                    'error' => 'PayPal credentials not configured',
                    'message' => 'PayPal credentials must be configured on the server. Please contact the administrator.',
                ], 500);
            }

            // Create failed transaction
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'type' => 'withdraw',
                'amount' => $amount,
                'status' => 'failed',
                'payment_method' => 'paypal',
                'paypal_email' => $paypalEmail,
                'description' => "Withdrawal Failed: $" . number_format($amount, 2) . " to PayPal: " . $paypalEmail,
            ]);

            return response()->json([
                'error' => 'Withdrawal failed',
                'message' => 'Unable to process withdrawal. Please try again later or contact support.',
                'transaction_id' => $transaction->id,
            ], 500);
        }

        // Extract payout batch ID
        $payoutBatchId = $payout['batch_header']['payout_batch_id'] ?? null;
        $payoutStatus = $payout['batch_header']['batch_status'] ?? 'PENDING';

        // Determine transaction status based on payout status
        $transactionStatus = 'pending';
        if ($payoutStatus === 'SUCCESS' || $payoutStatus === 'PROCESSING') {
            $transactionStatus = 'completed';
        } elseif ($payoutStatus === 'DENIED' || $payoutStatus === 'FAILED') {
            $transactionStatus = 'failed';
        }

        // Create transaction
        $transaction = Transaction::create([
            'user_id' => $user->id,
            'type' => 'withdraw',
            'amount' => $amount,
            'status' => $transactionStatus,
            'payment_method' => 'paypal',
            'payment_id' => $payoutBatchId,
            'paypal_email' => $paypalEmail,
            'description' => "Withdrawal: $" . number_format($amount, 2) . " to PayPal: " . $paypalEmail,
        ]);

        Log::info('Withdrawal processed', [
            'transaction_id' => $transaction->id,
            'user_id' => $user->id,
            'amount' => $amount,
            'paypal_email' => $paypalEmail,
            'payout_batch_id' => $payoutBatchId,
            'status' => $transactionStatus,
        ]);

        $message = $transactionStatus === 'completed' 
            ? 'Withdrawal processed successfully. Funds have been sent to your PayPal account.'
            : ($transactionStatus === 'pending' 
                ? 'Withdrawal is being processed. You will receive the funds shortly.'
                : 'Withdrawal processing failed. Please contact support.');

        return response()->json([
            'message' => $message,
            'transaction_id' => $transaction->id,
            'status' => $transactionStatus,
        ]);
    }

    /**
     * Get user's wallet transactions
     */
    public function getTransactions(Request $request)
    {
        $user = $request->user();
        $transactions = Transaction::where('user_id', $user->id)
            ->whereIn('type', ['deposit', 'withdraw'])
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($transactions);
    }
}

