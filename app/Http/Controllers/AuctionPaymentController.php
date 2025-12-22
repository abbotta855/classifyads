<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\Transaction;
use App\Models\User;
use App\Mail\AuctionPaymentConfirmation;
use App\Services\PayPalService;
use App\Services\AuctionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AuctionPaymentController extends Controller
{
    protected PayPalService $paypalService;
    protected AuctionService $auctionService;

    public function __construct(PayPalService $paypalService, AuctionService $auctionService)
    {
        $this->paypalService = $paypalService;
        $this->auctionService = $auctionService;
    }

    /**
     * Initiate PayPal payment for auction (Buy Now or Winning Bid)
     */
    public function initiatePayment(Request $request, string $auctionId)
    {
        $auction = Auction::findOrFail($auctionId);
        $paymentType = $request->input('type', 'buy_now'); // 'buy_now' or 'winning_bid'

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
            return response()->json(['error' => 'Failed to create PayPal order'], 500);
        }

        // Create pending transaction
        $transaction = Transaction::create([
            'user_id' => Auth::id(),
            'type' => $paymentType === 'buy_now' ? 'auction_payment' : 'auction_payment',
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

        $auction = Auction::findOrFail($auctionId);

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

        return redirect("/auctions/{$auction->id}?payment=success");
    }

    /**
     * Handle cancelled payment
     */
    public function paymentCancel(Request $request, string $auctionId)
    {
        return redirect("/auctions/{$auctionId}?payment=cancelled");
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
                    }
                }
            }
        }

        return response()->json(['status' => 'ok']);
    }
}
