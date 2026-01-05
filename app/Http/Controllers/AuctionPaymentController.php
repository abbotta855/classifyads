<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\Transaction;
use App\Models\User;
use App\Mail\AuctionPaymentConfirmation;
use App\Services\PayPalService;
use App\Services\AuctionService;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AuctionPaymentController extends Controller
{
    protected PayPalService $paypalService;
    protected AuctionService $auctionService;
    protected WalletService $walletService;

    public function __construct(PayPalService $paypalService, AuctionService $auctionService, WalletService $walletService)
    {
        $this->paypalService = $paypalService;
        $this->auctionService = $auctionService;
        $this->walletService = $walletService;
    }

    /**
     * Resolve auction by numeric id or slug.
     */
    private function findAuction(string $auctionId): Auction
    {
        // Avoid binding slug strings to numeric id column (Postgres will error)
        if (ctype_digit($auctionId)) {
            $auction = Auction::find($auctionId);
            if ($auction) {
                return $auction;
            }
        }

        return Auction::where('slug', $auctionId)->firstOrFail();
    }

    /**
     * Initiate PayPal payment for auction (Buy Now or Winning Bid)
     */
    public function initiatePayment(Request $request, string $auctionId)
    {
        $auction = $this->findAuction($auctionId);
        $paymentType = $request->input('type', 'buy_now'); // 'buy_now' or 'winning_bid'
        $demoMode = config('services.paypal.demo_mode', false);

        // Check if user is authenticated
        if (!Auth::check()) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        // Validate payment type and user eligibility
        if ($paymentType === 'buy_now') {
            // For Buy Now: user must not be seller, auction must be active, Buy Now must be available
            if ($auction->user_id === Auth::id()) {
                return response()->json(['error' => 'You cannot buy your own auction'], 400);
            }
            if ($auction->status !== 'active') {
                return response()->json(['error' => 'Auction is not active'], 400);
            }
            if (!$auction->buy_now_price || $auction->buy_now_price <= 0) {
                return response()->json(['error' => 'Buy Now is not available'], 400);
            }
            $amount = $auction->buy_now_price;
            $description = "Buy Now: {$auction->title}";
        } else {
            // For winning bid: user must be the winner, auction must be ended
            if ($auction->winner_id !== Auth::id()) {
                return response()->json(['error' => 'You are not the winner of this auction'], 400);
            }
            if ($auction->status !== 'ended') {
                return response()->json(['error' => 'Auction has not ended yet'], 400);
            }
            if ($auction->payment_completed_at) {
                return response()->json(['error' => 'Payment already completed for this auction'], 400);
            }
            $amount = $auction->current_bid_price ?? $auction->starting_price;
            $description = "Winning Bid: {$auction->title}";
        }

        /**
         * Wallet-first flow: if wallet has enough balance, process immediately.
         */
        $balance = $this->walletService->getAvailableBalance(Auth::id());
        if ($balance >= $amount) {
            try {
                DB::beginTransaction();

                // Debit buyer wallet
                Transaction::create([
                    'user_id' => Auth::id(),
                    'type' => 'withdraw',
                    'amount' => $amount,
                    'status' => 'completed',
                    'payment_method' => 'wallet',
                    'payment_id' => 'WALLET-DEBIT-' . now()->timestamp . '-' . Auth::id(),
                    'description' => "{$description} (Wallet)",
                    'auction_id' => $auction->id,
                ]);

                // Credit seller wallet
                Transaction::create([
                    'user_id' => $auction->user_id,
                    'type' => 'deposit',
                    'amount' => $amount,
                    'status' => 'completed',
                    'payment_method' => 'wallet',
                    'payment_id' => 'WALLET-CREDIT-' . now()->timestamp . '-' . $auction->user_id,
                    'description' => "Sale proceeds: {$description}",
                    'auction_id' => $auction->id,
                ]);

                // Mark auction as paid/completed
                $auction->update([
                    'status' => 'completed',
                    'payment_completed_at' => now(),
                    'winner_id' => $paymentType === 'buy_now' ? Auth::id() : ($auction->winner_id ?? Auth::id()),
                    'current_bid_price' => $paymentType === 'buy_now' ? $amount : ($auction->current_bid_price ?? $amount),
                ]);

                // Record winner/tracking for admin panels
                $this->auctionService->recordWinnerTracking($auction->fresh(['winner']), $auction->winner_id ?? Auth::id());

                DB::commit();

                return response()->json([
                    'wallet_paid' => true,
                    'message' => 'Payment completed with wallet balance',
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Wallet buy now failed', [
                    'auction_id' => $auction->id,
                    'user_id' => Auth::id(),
                    'error' => $e->getMessage(),
                ]);

                return response()->json([
                    'error' => 'Failed to process wallet payment',
                    'message' => $e->getMessage(),
                ], 500);
            }
        }

        // Not enough wallet balance – inform client to top up
        $shortfall = max(0, $amount - $balance);
        return response()->json([
            'error' => 'Insufficient wallet balance',
            'needs_top_up' => true,
            'balance' => $balance,
            'required' => $amount,
            'shortfall' => $shortfall,
        ], 402);

        /**
         * Demo mode: bypass PayPal and mark payment as completed immediately.
         */
        if ($demoMode) {
            $transaction = Transaction::create([
                'user_id' => Auth::id(),
                'type' => 'payment', // use generic type allowed by enum
                'amount' => $amount,
                'status' => 'completed',
                'payment_method' => 'demo',
                'payment_id' => 'DEMO-' . time() . '-' . Auth::id(),
                'paypal_email' => null,
                'description' => "{$description} (Demo Mode)",
                'auction_id' => $auction->id,
                'metadata' => ['payment_type' => $paymentType, 'demo_mode' => true],
            ]);

            // Mark auction as paid/completed
            $auction->update([
                'status' => 'completed',
                'payment_completed_at' => now(),
                // For buy now ensure winner
                'winner_id' => $paymentType === 'buy_now' ? Auth::id() : ($auction->winner_id ?? Auth::id()),
                'current_bid_price' => $paymentType === 'buy_now' ? $amount : ($auction->current_bid_price ?? $amount),
            ]);

            $this->auctionService->recordWinnerTracking($auction->fresh(['winner']), $auction->winner_id ?? Auth::id());

            return response()->json([
                'demo_mode' => true,
                'message' => 'Payment completed successfully (Demo Mode)',
                'transaction_id' => $transaction->id,
                'auction' => $auction->fresh(['winner']),
            ]);
        }

        // Create PayPal order
        $items = [
            [
                'name' => $auction->title,
                'description' => substr($auction->description ?? '', 0, 127),
                'quantity' => '1',
                'unit_amount' => [
                    'currency_code' => 'USD',
                    'value' => number_format($amount, 2, '.', ''),
                ],
            ],
        ];

        $returnUrl = config('app.url') . "/api/auctions/{$auction->id}/payment/success?type={$paymentType}";
        $cancelUrl = config('app.url') . "/api/auctions/{$auction->id}/payment/cancel";

        $order = $this->paypalService->createOrder($amount, 'USD', $items, $returnUrl, $cancelUrl);

        if (!$order) {
            // Provide clearer error when credentials are missing
            if (method_exists($this->paypalService, 'hasCredentials') && !$this->paypalService->hasCredentials()) {
                return response()->json(['error' => 'PayPal credentials not configured'], 500);
            }
            return response()->json(['error' => 'Failed to create PayPal order'], 500);
        }

        // Create pending transaction
        $transaction = Transaction::create([
            'user_id' => Auth::id(),
            'type' => 'payment', // use generic type allowed by enum
            'amount' => $amount,
            'status' => 'pending',
            'payment_method' => 'paypal',
            'payment_id' => $order['id'],
            'description' => $description,
            'auction_id' => $auction->id,
        ]);

        // If Buy Now, also create a bid record for tracking
        if ($paymentType === 'buy_now') {
            // The buyNow() method in AuctionService will handle this
            // But we need to track the transaction
            $transaction->update(['metadata' => ['payment_type' => 'buy_now']]);
        } else {
            // For winning bid, link to the winning bid
            $winningBid = Bid::where('auction_id', $auction->id)
                ->where('is_winning_bid', true)
                ->orderBy('bid_amount', 'desc')
                ->first();
            if ($winningBid) {
                $transaction->update(['bid_id' => $winningBid->id]);
            }
        }

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
    public function paymentSuccess(Request $request, string $auctionId)
    {
        $orderId = $request->input('token') ?? $request->input('order_id');
        $paymentType = $request->input('type', 'buy_now');

        if (!$orderId) {
            return redirect("/auctions/{$auctionId}?payment=error&message=" . urlencode('Payment verification failed'));
        }

        // Capture the order
        $capture = $this->paypalService->captureOrder($orderId);

        if (!$capture || $capture['status'] !== 'COMPLETED') {
            return redirect("/auctions/{$auctionId}?payment=error&message=" . urlencode('Payment capture failed'));
        }

        // Find transaction by payment_id
        $transaction = Transaction::where('payment_id', $orderId)
            ->where('status', 'pending')
            ->where('auction_id', $auctionId)
            ->first();

        if (!$transaction) {
            return redirect("/auctions/{$auctionId}?payment=error&message=" . urlencode('Transaction not found'));
        }

        $auction = $this->findAuction($auctionId);

        // Update transaction
        $transaction->update([
            'status' => 'completed',
        ]);

        // Note: For Buy Now, the auction is already ended by the buyNow() method before payment
        // For winning bid, the auction is already ended when winner was determined
        // So we just need to mark as completed after payment
        
        // Mark auction as completed after payment
        $auction->update([
            'status' => 'completed',
            'payment_completed_at' => now(),
        ]);

        // Record winner/tracking for admin panels
        if ($auction->winner_id) {
            $this->auctionService->recordWinnerTracking($auction->fresh(['winner']), $auction->winner_id);
        }

        // Send payment confirmation emails
        try {
            // Email to buyer
            $buyer = User::find($transaction->user_id);
            if ($buyer && $buyer->email) {
                Mail::to($buyer->email)->send(
                    new AuctionPaymentConfirmation(
                        $auction->fresh(['user']), 
                        $transaction->fresh(['user']), 
                        true
                    )
                );
            }

            // Email to seller
            $seller = User::find($auction->user_id);
            if ($seller && $seller->email) {
                Mail::to($seller->email)->send(
                    new AuctionPaymentConfirmation(
                        $auction->fresh(['user']), 
                        $transaction->fresh(['user']), 
                        false
                    )
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to send payment confirmation emails', [
                'auction_id' => $auction->id,
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage(),
            ]);
        }

        return redirect("/auctions/{$auction->slug}?payment=success");
    }

    /**
     * Handle cancelled payment
     */
    public function paymentCancel(Request $request, string $auctionId)
    {
        $auction = $this->findAuction($auctionId);
        return redirect("/auctions/{$auction->slug}?payment=cancelled");
    }

    /**
     * PayPal webhook handler
     */
    public function webhook(Request $request)
    {
        $eventType = $request->input('event_type');
        $resource = $request->input('resource');

        if ($eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            $orderId = $resource['supplementary_data']['related_ids']['order_id'] ?? null;

            if ($orderId) {
                $transaction = Transaction::where('payment_id', $orderId)
                    ->where('status', 'pending')
                    ->first();

                if ($transaction && $transaction->auction_id) {
                    $auction = Auction::find($transaction->auction_id);
                    
                    if ($auction) {
                        // Update transaction
                        $transaction->update(['status' => 'completed']);
                        
                        // Mark auction as completed
                        $auction->update([
                            'status' => 'completed',
                            'payment_completed_at' => now(),
                        ]);

                        // Record winner/tracking
                        if ($auction->winner_id) {
                            $this->auctionService->recordWinnerTracking($auction->fresh(['winner']), $auction->winner_id);
                        }
                    }
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }
}
