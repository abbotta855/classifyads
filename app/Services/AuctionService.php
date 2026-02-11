<?php

namespace App\Services;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\BiddingHistory;
use App\Models\BidWinner;
use App\Models\BiddingTracking;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\Transaction;
use App\Mail\AuctionWinNotification;
use App\Services\PayPalService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class AuctionService
{
    protected PayPalService $paypalService;

    public function __construct(PayPalService $paypalService)
    {
        $this->paypalService = $paypalService;
    }

    /**
     * Place a bid on an auction
     * @param int $auctionId
     * @param int $userId
     * @param float $amount The bid amount (or minimum bid if proxy bidding)
     * @param float|null $maxBidAmount Optional maximum bid amount for proxy bidding
     * @return array
     */
    public function placeBid(int $auctionId, int $userId, float $amount, ?float $maxBidAmount = null): array
    {
        DB::beginTransaction();
        
        try {
            $auction = Auction::lockForUpdate()->findOrFail($auctionId);
            
            // Validate bid
            $validation = $this->validateBid($auction, $userId, $amount);
            if (!$validation['valid']) {
                return $validation;
            }
            
            // Get previous winning bidder (if exists)
            $previousBidderId = $auction->current_bidder_id;
            
            // Mark previous winning bid as outbid
            $previousBidderIdForNotification = null;
            if ($previousBidderId) {
                Bid::where('auction_id', $auctionId)
                    ->where('is_winning_bid', true)
                    ->update([
                        'is_winning_bid' => false,
                        'outbid_at' => now(),
                    ]);
                
                // Store for notification after commit (to avoid transaction rollback)
                $previousBidderIdForNotification = $previousBidderId;
            }
            
            // Check if we need to extend auction (anti-sniping)
            // If bid is placed within last 5 minutes, extend auction by 5 minutes
            $extensionMinutes = 5; // Configurable extension time
            $extensionWindowMinutes = 5; // Window before end_time to trigger extension
            $now = now();
            $originalEndTime = $auction->end_time->copy(); // Create a copy to avoid mutation
            $timeUntilEnd = $originalEndTime->diffInMinutes($now, false); // Negative if past end_time
            
            $shouldExtend = false;
            $newEndTime = $originalEndTime;
            
            if ($timeUntilEnd <= $extensionWindowMinutes && $timeUntilEnd > 0) {
                // Bid placed within last 5 minutes - extend auction
                $shouldExtend = true;
                $newEndTime = $originalEndTime->copy()->addMinutes($extensionMinutes);
                
                Log::info('Extending auction due to bid near end time', [
                    'auction_id' => $auctionId,
                    'original_end_time' => $originalEndTime->toIso8601String(),
                    'new_end_time' => $newEndTime->toIso8601String(),
                    'minutes_until_end' => $timeUntilEnd,
                    'extension_minutes' => $extensionMinutes,
                ]);
            }
            
            // Determine if this is a proxy bid
            $isProxyBid = $maxBidAmount !== null && $maxBidAmount > $amount;
            
            // If proxy bid, calculate the actual bid amount (minimum needed to be winning)
            $actualBidAmount = $amount;
            if ($isProxyBid) {
                // For proxy bids, start with the minimum bid amount
                $actualBidAmount = $amount;
                // But we'll store the max_bid_amount for future auto-bidding
            }
            
            // Create new bid
            $bid = Bid::create([
                'auction_id' => $auctionId,
                'user_id' => $userId,
                'bid_amount' => $actualBidAmount,
                'max_bid_amount' => $maxBidAmount,
                'is_proxy_bid' => $isProxyBid,
                'is_winning_bid' => true,
            ]);

            // Ensure bidding_history table is populated for admin tracking
            $paymentMethod = 'N/A';
            if (is_array($auction->payment_methods) && !empty($auction->payment_methods)) {
                $paymentMethod = $auction->payment_methods[0];
            } elseif (is_string($auction->payment_methods) && $auction->payment_methods !== '') {
                $paymentMethod = $auction->payment_methods;
            }

            BiddingHistory::create([
                'user_id' => $userId,
                'auction_id' => $auctionId,
                'item_name' => $auction->title ?? 'Auction Item',
                'reserve_price' => $auction->reserve_price ?? 0,
                'buy_now_price' => $auction->buy_now_price ?? 0,
                'payment_method' => $paymentMethod,
                'start_date_time' => $auction->start_time ?? now(),
            ]);
            
            Log::info('Bid created', [
                'bid_id' => $bid->id,
                'auction_id' => $auctionId,
                'user_id' => $userId,
                'bid_amount' => $actualBidAmount,
                'max_bid_amount' => $maxBidAmount,
                'is_proxy_bid' => $isProxyBid,
            ]);
            
            // Update auction (including end_time if extended)
            $updateData = [
                'current_bid_price' => $actualBidAmount,
                'current_bidder_id' => $userId,
            ];
            
            if ($shouldExtend) {
                $updateData['end_time'] = $newEndTime;
            }
            
            $auction->update($updateData);
            
            DB::commit();
            
            // After committing, check if we need to process proxy bids
            // This happens when someone else bids and there are active proxy bids
            // For now, we'll process proxy bids in a separate method that gets called
            // when a new bid is placed (to auto-bid on behalf of proxy bidders)
            
            // Send notifications AFTER commit to avoid transaction rollback
            // This ensures the bid is saved even if notifications fail
            if ($previousBidderIdForNotification) {
                try {
                    $this->sendOutbidNotification($previousBidderIdForNotification, $auction);
                } catch (\Exception $e) {
                    Log::error('Failed to send outbid notification (non-critical)', [
                        'user_id' => $previousBidderIdForNotification,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            try {
                $this->sendBidPlacedNotification($userId, $auction, $amount);
            } catch (\Exception $e) {
                // Log but don't fail the bid placement
                Log::error('Failed to send bid placed notification (non-critical)', [
                    'user_id' => $userId,
                    'auction_id' => $auctionId,
                    'error' => $e->getMessage()
                ]);
            }
            
            // Force a new database connection to see the committed transaction
            // Clear any model cache and get fresh instance
            DB::connection()->getPdo()->exec('SELECT 1'); // Force connection refresh
            
            // Get a completely fresh instance of the auction
            $auction = Auction::withoutGlobalScopes()
                ->with(['currentBidder', 'bids'])
                ->findOrFail($auctionId);
            
            // Verify bid count using direct query - force fresh connection
            $directBidCount = DB::table('bids')
                ->where('auction_id', $auctionId)
                ->count();
            
            Log::info('Bid placed successfully', [
                'auction_id' => $auctionId,
                'bid_id' => $bid->id,
                'bid_amount' => $actualBidAmount,
                'max_bid_amount' => $maxBidAmount,
                'is_proxy_bid' => $isProxyBid,
                'bid_count_from_relationship' => $auction->bids()->count(),
                'bid_count_from_direct_query' => $directBidCount,
                'bid_count_from_db_table' => $directBidCount,
                'bids_collection_count' => $auction->bids->count(),
            ]);
            
            // Process proxy bids after this bid is placed
            // This will auto-bid on behalf of users who have proxy bids set
            $proxyBidResult = $this->processProxyBids($auctionId, $userId, $actualBidAmount);
            
            // Reload auction after proxy bids are processed
            $finalAuction = $proxyBidResult['auction'] ?? $auction;
            
            return [
                'valid' => true,
                'message' => $isProxyBid 
                    ? "Proxy bid placed successfully. Maximum bid: Rs. " . number_format($maxBidAmount, 2)
                    : 'Bid placed successfully',
                'bid' => $bid,
                'auction' => $finalAuction,
                'is_proxy_bid' => $isProxyBid,
                'max_bid_amount' => $maxBidAmount,
                'proxy_bids_processed' => $proxyBidResult['processed'] ?? 0,
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to place bid', [
                'auction_id' => $auctionId,
                'user_id' => $userId,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'valid' => false,
                'message' => 'Failed to place bid: ' . $e->getMessage(),
            ];
        }
    }
    
    /**
     * Validate a bid
     */
    public function validateBid(Auction $auction, int $userId, float $amount): array
    {
        // Check auction is active
        if (!$auction->isActive()) {
            return [
                'valid' => false,
                'message' => 'Auction is not active',
            ];
        }
        
        // Check user is not the seller
        if ($auction->user_id === $userId) {
            return [
                'valid' => false,
                'message' => 'You cannot bid on your own auction',
            ];
        }
        
        // Calculate minimum bid
        $minimumBid = $auction->getNextMinimumBid();
        
        // Check bid amount is sufficient
        if ($amount < $minimumBid) {
            return [
                'valid' => false,
                'message' => "Minimum bid is Rs. " . number_format($minimumBid, 2),
                'minimum_bid' => $minimumBid,
            ];
        }
        
        // If Buy Now price exists and bid >= Buy Now, suggest using Buy Now instead
        if ($auction->buy_now_price && $amount >= $auction->buy_now_price) {
            return [
                'valid' => false,
                'message' => "Your bid exceeds or equals the Buy Now price (Rs. " . number_format($auction->buy_now_price, 2) . "). Please use Buy Now instead.",
                'buy_now_price' => $auction->buy_now_price,
                'suggest_buy_now' => true,
            ];
        }
        
        // Check for unusually high bids (more than 10x starting price)
        // This is a warning, not an error - user can still proceed with confirmation
        $startingPrice = (float) $auction->starting_price;
        $maxReasonableBid = $startingPrice * 10; // 10x starting price
        
        if ($amount > $maxReasonableBid) {
            return [
                'valid' => true, // Still valid, but requires confirmation
                'requires_confirmation' => true,
                'message' => "Warning: Your bid of Rs. " . number_format($amount, 2) . " is unusually high (more than 10x the starting price of Rs. " . number_format($startingPrice, 2) . "). Please confirm you want to proceed.",
                'bid_amount' => $amount,
                'starting_price' => $startingPrice,
                'multiplier' => round($amount / $startingPrice, 2),
            ];
        }
        
        // NOTE: Reserve price check removed - reserve price is hidden during bidding
        // It will only be checked when determining the winner at auction end
        
        return ['valid' => true];
    }
    
    /**
     * Cancel a bid
     * Allowed if:
     * 1. Bid was placed within the last 5 minutes (time window), OR
     * 2. Bid has not been outbid yet (is_winning_bid = true)
     * 
     * @param int $bidId The bid ID to cancel
     * @param int $userId The user ID requesting cancellation (must be the bidder)
     * @return array
     */
    public function cancelBid(int $bidId, int $userId): array
    {
        DB::beginTransaction();
        
        try {
            // Check if bid exists first (without lock to avoid unnecessary locking)
            $bid = Bid::find($bidId);
            if (!$bid) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Bid not found or has already been cancelled',
                ];
            }
            
            // Now lock for update
            $bid = Bid::lockForUpdate()->findOrFail($bidId);
            $auction = Auction::lockForUpdate()->findOrFail($bid->auction_id);
            
            // Validate user owns this bid
            if ($bid->user_id !== $userId) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'You can only cancel your own bids',
                ];
            }
            
            // Check if bid can be cancelled
            $canCancel = false;
            $reason = '';
            
            // Check 1: Bid was placed within last 5 minutes
            $timeWindowMinutes = 5;
            $timeSinceBid = $bid->created_at->diffInMinutes(now());
            
            if ($timeSinceBid <= $timeWindowMinutes) {
                $canCancel = true;
                $reason = "Bid placed within last {$timeWindowMinutes} minutes";
            }
            
            // Check 2: Bid has not been outbid (still winning)
            if (!$canCancel && $bid->is_winning_bid) {
                $canCancel = true;
                $reason = 'Bid has not been outbid yet';
            }
            
            if (!$canCancel) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Bid cannot be cancelled. Bids can only be cancelled within 5 minutes of placement or before being outbid.',
                ];
            }
            
            // Check if auction is still active
            if (!$auction->isActive()) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Cannot cancel bid on an inactive auction',
                ];
            }
            
            Log::info('Cancelling bid', [
                'bid_id' => $bidId,
                'user_id' => $userId,
                'auction_id' => $auction->id,
                'bid_amount' => $bid->bid_amount,
                'is_winning_bid' => $bid->is_winning_bid,
                'reason' => $reason,
            ]);
            
            $wasWinningBid = $bid->is_winning_bid;
            $bidAmount = $bid->bid_amount; // Store before deletion
            $auctionTitle = $auction->title; // Store before potential changes
            
            // Delete the bid
            $bid->delete();
            
            Log::info('Bid deleted successfully', [
                'bid_id' => $bidId,
                'auction_id' => $auction->id,
            ]);
            
            // If this was the winning bid, we need to update the auction
            if ($wasWinningBid) {
                // Find the previous highest bid (if any)
                $previousBid = Bid::where('auction_id', $auction->id)
                    ->where('id', '!=', $bidId)
                    ->orderBy('bid_amount', 'desc')
                    ->first();
                
                if ($previousBid) {
                    // Mark previous bid as winning
                    $previousBid->update([
                        'is_winning_bid' => true,
                        'outbid_at' => null,
                    ]);
                    
                    // Update auction with previous bidder
                    $auction->update([
                        'current_bid_price' => $previousBid->bid_amount,
                        'current_bidder_id' => $previousBid->user_id,
                    ]);
                    
                    // Notify previous bidder they're now winning
                    try {
                        $this->sendBidPlacedNotification($previousBid->user_id, $auction, $previousBid->bid_amount);
                    } catch (\Exception $e) {
                        Log::error('Failed to send notification to previous bidder', [
                            'user_id' => $previousBid->user_id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                } else {
                    // No other bids - reset auction to starting price
                    $auction->update([
                        'current_bid_price' => $auction->starting_price,
                        'current_bidder_id' => null,
                    ]);
                }
            }
            
            DB::commit();
            
            // Send cancellation notification to the user (after commit to avoid transaction issues)
            try {
                UserNotification::create([
                    'user_id' => $userId,
                    'type' => 'bid_cancelled',
                    'title' => 'Bid Cancelled',
                    'message' => "Your bid of Rs. " . number_format($bidAmount, 2) . " on '{$auctionTitle}' has been cancelled successfully.",
                    'metadata' => [
                        'auction_id' => $auction->id,
                        'bid_id' => $bidId,
                        'bid_amount' => $bidAmount,
                    ],
                    'link' => "/auctions/{$auction->id}",
                    'is_read' => false,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send bid cancellation notification', [
                    'user_id' => $userId,
                    'error' => $e->getMessage(),
                ]);
            }
            
            return [
                'success' => true,
                'message' => 'Bid cancelled successfully',
                'auction' => $auction->fresh(['currentBidder', 'bids']),
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to cancel bid', [
                'bid_id' => $bidId,
                'user_id' => $userId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to cancel bid: ' . $e->getMessage(),
            ];
        }
    }
    
    /**
     * Determine winner of an auction
     */
    public function determineWinner(int $auctionId): array
    {
        DB::beginTransaction();
        
        try {
            $auction = Auction::lockForUpdate()->findOrFail($auctionId);
            
            // Get highest bid - query ALL bids, not just is_winning_bid=true
            // This ensures we get the actual highest bid even if is_winning_bid flag has issues
            $highestBid = Bid::where('auction_id', $auctionId)
                ->orderBy('bid_amount', 'desc')
                ->first();
            
            if (!$highestBid) {
                // No bids received - auction ends with no winner
                $auction->update(['status' => 'ended', 'winner_id' => null]);
                
                // Notify seller that auction ended with no bids
                $this->sendSellerNotification($auction->user_id, $auction);
                
            DB::commit();
            
            return [
                'success' => true,
                'message' => 'Auction ended with no bids',
                'winner' => null,
                'auction' => $auction->fresh(),
            ];
            }
            
            // Check reserve price
            if ($auction->reserve_price && $highestBid->bid_amount < $auction->reserve_price) {
                // Reserve price not met - auction ends with no winner
                $auction->update(['status' => 'ended', 'winner_id' => null]);
                
                // Notify seller that reserve was not met
                $this->sendSellerNotification($auction->user_id, $auction);
                
                // Notify all bidders that auction ended without meeting reserve
                $this->sendReserveNotMetNotifications($auctionId, $auction);
                
                DB::commit();
                
                return [
                    'success' => true,
                    'message' => 'Reserve price not met. Auction ended with no winner.',
                    'winner' => null,
                    'reserve_price' => $auction->reserve_price,
                    'highest_bid' => $highestBid->bid_amount,
                    'auction' => $auction->fresh(),
                ];
            }
            
            // Update auction with winner
            $auction->update([
                'status' => 'ended',
                'winner_id' => $highestBid->user_id,
            ]);
            
            // Create winner records (BidWinner and BiddingTracking)
            // This will be called again in endAuction, but createWinnerRecords checks for duplicates
            $this->createWinnerRecords($auction, $highestBid->user_id);
            
            // Send notifications
            $this->sendWinnerNotification($highestBid->user_id, $auction);
            $this->sendSellerNotification($auction->user_id, $auction);
            $this->sendLoserNotifications($auctionId, $highestBid->user_id);
            
            DB::commit();
            
            return [
                'success' => true,
                'message' => 'Winner determined successfully',
                'winner' => $highestBid->user,
                'winning_bid' => $highestBid,
                'auction' => $auction->fresh(['user', 'currentBidder', 'category', 'location', 'winner']),
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to determine winner', [
                'auction_id' => $auctionId,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to determine winner: ' . $e->getMessage(),
            ];
        }
    }
    
    /**
     * End an auction (called by scheduled job or manually)
     */
    public function endAuction(int $auctionId): array
    {
        DB::beginTransaction();
        
        try {
            // Lock the auction row to prevent race conditions
            $auction = Auction::lockForUpdate()->findOrFail($auctionId);
            
            // Check if auction is already ended (status = 'ended' or 'completed')
            if (in_array($auction->status, ['ended', 'completed'])) {
                DB::rollBack();
                Log::info('Attempted to end already ended auction', ['auction_id' => $auctionId, 'current_status' => $auction->status]);
                return [
                    'success' => false,
                    'message' => 'Auction has already ended',
                ];
            }
            
            Log::info('Ending auction', [
                'auction_id' => $auctionId,
                'current_status' => $auction->status,
                'current_bid_price' => $auction->current_bid_price,
                'original_end_time' => $auction->end_time,
            ]);
            
            // Update status to ended - preserve original end_time for historical accuracy
            // Only update status, don't modify end_time to preserve when auction was originally scheduled to end
            $auction->status = 'ended';
            $auction->save();
            
            Log::info('Auction status updated to ended', [
                'auction_id' => $auctionId,
                'new_status' => $auction->status,
            ]);
            
            // Commit the status update first
            DB::commit();
            
            // Now determine winner (this will handle its own transaction)
            // We do this after committing to ensure status is saved even if winner determination fails
            try {
                $result = $this->determineWinner($auctionId);
                
                // Reload auction with all relationships
                $auction = Auction::with(['user', 'currentBidder', 'category', 'location', 'winner'])->findOrFail($auctionId);
                
                if ($result['success']) {
                    Log::info('Auction ended successfully with winner determined', [
                        'auction_id' => $auctionId,
                        'winner_id' => $result['winner']->id ?? null,
                    ]);

                if (!empty($result['winner']?->id)) {
                    $this->createWinnerRecords($auction, $result['winner']->id);
                }
                    
                    return [
                        'success' => true,
                        'message' => $result['message'],
                        'auction' => $auction,
                        'winner' => $result['winner'] ?? null,
                    ];
                } else {
                    // Winner determination failed, but auction is ended - that's okay
                    Log::warning('Auction ended but winner determination failed', [
                        'auction_id' => $auctionId,
                        'error' => $result['message'],
                    ]);
                    
                    return [
                        'success' => true,
                        'message' => 'Auction ended successfully. ' . $result['message'],
                        'auction' => $auction,
                        'winner' => null,
                    ];
                }
            } catch (\Exception $e) {
                // Winner determination failed, but auction status is already updated
                Log::warning('Auction ended but winner determination threw exception', [
                    'auction_id' => $auctionId,
                    'error' => $e->getMessage(),
                ]);
                
                // Reload auction with relationships
                $auction = Auction::with(['user', 'currentBidder', 'category', 'location', 'winner'])->findOrFail($auctionId);
                
                return [
                    'success' => true,
                    'message' => 'Auction ended successfully. Winner determination will be processed separately.',
                    'auction' => $auction,
                    'winner' => null,
                ];
            }
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to end auction', [
                'auction_id' => $auctionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to end auction: ' . $e->getMessage(),
            ];
        }
    }
    
    /**
     * Buy Now - Purchase auction immediately at Buy Now price
     */
    public function buyNow(int $auctionId, int $userId): array
    {
        DB::beginTransaction();
        
        try {
            $auction = Auction::lockForUpdate()->findOrFail($auctionId);
            
            // Validate Buy Now
            $validation = $this->validateBuyNow($auction, $userId);
            if (!$validation['valid']) {
                return $validation;
            }
            
            // End auction immediately
            $auction->update([
                'status' => 'ended',
                'winner_id' => $userId,
                'current_bid_price' => $auction->buy_now_price,
            ]);
            
            // Mark any existing winning bids as outbid
            Bid::where('auction_id', $auctionId)
                ->where('is_winning_bid', true)
                ->update([
                    'is_winning_bid' => false,
                    'outbid_at' => now(),
                ]);
            
            // Notify previous bidders (if any)
            $previousBidders = Bid::where('auction_id', $auctionId)
                ->where('user_id', '!=', $userId)
                ->distinct()
                ->pluck('user_id');
            
            foreach ($previousBidders as $bidderId) {
                $this->sendOutbidNotification($bidderId, $auction);
            }
            
            // Send winner notification
            $this->sendWinnerNotification($userId, $auction);
            
            // Send seller notification
            $this->sendSellerNotification($auction->user_id, $auction);

            // Track winner and bidding tracking
            $this->createWinnerRecords($auction, $userId);
            
            DB::commit();
            
            return [
                'success' => true,
                'message' => 'Auction purchased successfully via Buy Now',
                'auction' => $auction->fresh(['winner']),
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to process Buy Now', [
                'auction_id' => $auctionId,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to process Buy Now: ' . $e->getMessage(),
            ];
        }
    }
    
    /**
     * Validate Buy Now purchase
     */
    private function validateBuyNow(Auction $auction, int $userId): array
    {
        // Check auction is active
        if (!$auction->isActive()) {
            return [
                'valid' => false,
                'message' => 'Auction is not active',
            ];
        }
        
        // Check user is not the seller
        if ($auction->user_id === $userId) {
            return [
                'valid' => false,
                'message' => 'You cannot buy your own auction',
            ];
        }
        
        // Check Buy Now price exists
        if (!$auction->buy_now_price || $auction->buy_now_price <= 0) {
            return [
                'valid' => false,
                'message' => 'Buy Now is not available for this auction',
            ];
        }
        
        // Check if Buy Now is still available (if current bid >= buy_now_price, Buy Now is no longer available)
        if ($auction->current_bid_price && $auction->current_bid_price >= $auction->buy_now_price) {
            return [
                'valid' => false,
                'message' => 'Buy Now is no longer available. Current bid has reached or exceeded Buy Now price.',
            ];
        }
        
        return ['valid' => true];
    }
    
    /**
     * Calculate next minimum bid
     */
    public function calculateNextMinimumBid(Auction $auction): float
    {
        return $auction->getNextMinimumBid();
    }
    
    /**
     * Record winner and tracking rows for admin reporting tables
     */
    /**
     * Public entry to record winner/tracking for auctions
     */
    public function recordWinnerTracking(Auction $auction, int $winnerId): void
    {
        $this->createWinnerRecords($auction, $winnerId);
    }

    private function createWinnerRecords(Auction $auction, int $winnerId): void
    {
        try {
            // Check if BidWinner exists
            $existingBidWinner = BidWinner::where('auction_id', $auction->id)->first();
            
            // If BidWinner exists but BiddingTracking doesn't, create it
            if ($existingBidWinner) {
                $existingTracking = \App\Models\BiddingTracking::where('bid_winner_id', $existingBidWinner->id)->first();
                if (!$existingTracking) {
                    $winnerUser = User::find($winnerId);
                    \App\Models\BiddingTracking::create([
                        'bid_winner_id' => $existingBidWinner->id,
                        'bid_winner_name' => $winnerUser?->name ?? 'Winner',
                        'bid_won_item_name' => $auction->title ?? 'Auction Item',
                        'payment_status' => 'Pending',
                        'pickup_status' => 'Not Started',
                        'complete_process_date_time' => null,
                        'alert_sent' => false,
                    ]);
                }
                return; // Both records exist, nothing to do
            }

            // Create both BidWinner and BiddingTracking
            $winnerUser = User::find($winnerId);
            $nowDate = now()->toDateString();
            $startDate = $auction->start_time ? $auction->start_time->toDateString() : $nowDate;
            $wonDate = $auction->end_time ? $auction->end_time->toDateString() : $nowDate;
            $paymentDate = $nowDate;

            $bidWinner = BidWinner::create([
                'user_id' => $winnerId,
                'auction_id' => $auction->id,
                'bidding_item' => $auction->title ?? 'Auction Item',
                'bid_start_date' => $startDate,
                'bid_won_date' => $wonDate,
                'payment_proceed_date' => $paymentDate,
                'total_payment' => $auction->current_bid_price ?? $auction->buy_now_price ?? 0,
                'seller_id' => $auction->user_id,
                'congratulation_email_sent' => false,
            ]);

            \App\Models\BiddingTracking::create([
                'bid_winner_id' => $bidWinner->id,
                'bid_winner_name' => $winnerUser?->name ?? 'Winner',
                'bid_won_item_name' => $auction->title ?? 'Auction Item',
                'payment_status' => 'Pending',
                'pickup_status' => 'Not Started',
                'complete_process_date_time' => null,
                'alert_sent' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create winner tracking', [
                'auction_id' => $auction->id,
                'winner_id' => $winnerId,
                'error' => $e->getMessage(),
            ]);
        }
    }
    
    /**
     * Send outbid notification
     */
    private function sendOutbidNotification(int $userId, Auction $auction): void
    {
        try {
            UserNotification::create([
                'user_id' => $userId,
                'type' => 'outbid',
                'title' => 'You have been outbid',
                'message' => "Someone placed a higher bid on '{$auction->title}'. Current bid: Rs. " . number_format($auction->current_bid_price, 2),
                'metadata' => ['auction_id' => $auction->id],
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send outbid notification', ['user_id' => $userId, 'error' => $e->getMessage()]);
        }
    }
    
    /**
     * Send bid placed notification
     */
    private function sendBidPlacedNotification(int $userId, Auction $auction, float $amount): void
    {
        try {
            UserNotification::create([
                'user_id' => $userId,
                'type' => 'bid_placed',
                'title' => 'Bid placed successfully',
                'message' => "Your bid of Rs. " . number_format($amount, 2) . " has been placed on '{$auction->title}'",
                'metadata' => ['auction_id' => $auction->id, 'bid_amount' => $amount],
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send bid placed notification', ['user_id' => $userId, 'error' => $e->getMessage()]);
        }
    }
    
    /**
     * Send winner notification
     */
    private function sendWinnerNotification(int $userId, Auction $auction): void
    {
        try {
            // In-app notification
            UserNotification::create([
                'user_id' => $userId,
                'type' => 'auction_won',
                'title' => 'Congratulations! You won the auction',
                'message' => "You won the auction for '{$auction->title}'. Please complete payment to claim your item.",
                'metadata' => ['auction_id' => $auction->id],
                'link' => "/auctions/{$auction->id}",
                'is_read' => false,
            ]);

            // Email notification
            $user = User::find($userId);
            if ($user && $user->email) {
                $winningBid = Bid::where('auction_id', $auction->id)
                    ->where('user_id', $userId)
                    ->where('is_winning_bid', true)
                    ->orderBy('bid_amount', 'desc')
                    ->first();
                    
                Mail::to($user->email)->send(
                    new AuctionWinNotification($auction->fresh(['winner', 'user']), $winningBid)
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to send winner notification', ['user_id' => $userId, 'error' => $e->getMessage()]);
        }
    }
    
    /**
     * Send seller notification
     */
    private function sendSellerNotification(int $userId, Auction $auction): void
    {
        try {
            UserNotification::create([
                'user_id' => $userId,
                'type' => 'auction_ended',
                'title' => 'Your auction has ended',
                'message' => "Your auction '{$auction->title}' has ended. Winner will complete payment soon.",
                'metadata' => ['auction_id' => $auction->id],
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send seller notification', ['user_id' => $userId, 'error' => $e->getMessage()]);
        }
    }
    
    /**
     * Send notifications to losing bidders
     */
    /**
     * Send notifications when reserve price is not met
     */
    private function sendReserveNotMetNotifications(int $auctionId, Auction $auction): void
    {
        try {
            // Get all bidders
            $bidders = Bid::where('auction_id', $auctionId)
                ->distinct()
                ->pluck('user_id');
            
            foreach ($bidders as $bidderId) {
                UserNotification::create([
                    'user_id' => $bidderId,
                    'type' => 'auction_finished',
                    'title' => 'Auction Ended - Reserve Not Met',
                    'message' => "The auction '{$auction->title}' ended without meeting the reserve price. No winner was determined.",
                    'metadata' => ['auction_id' => $auctionId],
                    'link' => "/auctions/{$auction->id}",
                    'is_read' => false,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send reserve not met notifications', [
                'auction_id' => $auctionId,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Process proxy bids - auto-bid on behalf of users who have set maximum bids
     * This is called after a regular bid is placed to check if proxy bids should auto-bid
     * Continues processing until no more proxy bids can be placed
     */
    private function processProxyBids(int $auctionId, int $excludeUserId, float $currentBidAmount): array
    {
        $processed = 0;
        $auction = null;
        $maxIterations = 100; // Safety limit to prevent infinite loops
        $iteration = 0;
        
        try {
            $bidIncrement = Auction::findOrFail($auctionId)->bid_increment ?? 1.00;
            $nextMinimumBid = $currentBidAmount + $bidIncrement;
            
            // Keep processing proxy bids until no more can be placed
            while ($iteration < $maxIterations) {
                $iteration++;
                
                // Get the auction with fresh data
                $auction = Auction::lockForUpdate()->findOrFail($auctionId);
                $currentBidPrice = (float) $auction->current_bid_price;
                $currentBidderId = $auction->current_bidder_id;
                
                // Calculate next minimum bid based on current bid price
                $nextMinimumBid = $currentBidPrice + $bidIncrement;
                
                // Find active proxy bids that can bid at the next minimum
                // Exclude the current bidder (they just bid, so their proxy shouldn't auto-bid against themselves)
                $activeProxyBids = Bid::where('auction_id', $auctionId)
                    ->where('user_id', '!=', $currentBidderId) // Not the current bidder
                    ->whereNotNull('max_bid_amount')
                    ->where('max_bid_amount', '>=', $nextMinimumBid) // Max allows bidding at next minimum
                    ->where(function($query) use ($auctionId) {
                        // Get the latest bid for each user (their most recent proxy bid setting)
                        $query->whereIn('id', function($subquery) use ($auctionId) {
                            $subquery->select(DB::raw('MAX(id)'))
                                ->from('bids')
                                ->where('auction_id', $auctionId)
                                ->whereNotNull('max_bid_amount')
                                ->groupBy('user_id');
                        });
                    })
                    ->orderBy('max_bid_amount', 'desc') // Process highest max bids first
                    ->orderBy('created_at', 'asc') // Earlier bids get priority if same max
                    ->get();
                
                if ($activeProxyBids->isEmpty()) {
                    // No more proxy bids can be placed
                    break;
                }
                
                // Process the first (highest max) proxy bid
                $proxyBid = $activeProxyBids->first();
                
                // Calculate the bid amount with optimal proxy bidding strategy
                // 
                // Strategy zones:
                // 1. Zone 1 (current_bid >= max - 2 * increment): Decision point - bid maximum directly
                // 2. Zone 2 (current_bid >= max - 3 * increment): Manual bid zone - stop auto-bidding
                // 3. Zone 3 (current_bid < max - 3 * increment): Normal auto-bidding
                //
                // Example: Person A max = 200,000, increment = 1,000
                // - Zone 1 (>= 198,000): Bid 200,000 directly (decision point)
                // - Zone 2 (>= 197,000): Stop auto-bidding, require manual bid
                // - Zone 3 (< 197,000): Continue auto-bidding incrementally
                //
                // Why manual bid zone?
                // - Gives users control when approaching their maximum
                // - Allows users to decide if they want to bid their full maximum
                // - More user-friendly: Users can reconsider before committing to max bid
                $twoIncrementsBeforeMax = $proxyBid->max_bid_amount - (2 * $bidIncrement);
                $threeIncrementsBeforeMax = $proxyBid->max_bid_amount - (3 * $bidIncrement);
                
                if ($currentBidPrice >= $twoIncrementsBeforeMax) {
                    // Zone 1: Decision point - bid the maximum directly
                    $proxyBidAmount = $proxyBid->max_bid_amount;
                    
                    Log::info('Proxy bidder bidding maximum directly (decision point reached)', [
                        'user_id' => $proxyBid->user_id,
                        'max_bid_amount' => $proxyBid->max_bid_amount,
                        'current_bid_price' => $currentBidPrice,
                        'two_increments_before_max' => $twoIncrementsBeforeMax,
                        'reason' => 'At decision point (two increments before maximum) - optimal strategy when opponent max is unknown',
                    ]);
                } elseif ($currentBidPrice >= $threeIncrementsBeforeMax) {
                    // Zone 2: Manual bid zone - stop auto-bidding, skip this proxy bid
                    // User should bid manually when they're this close to their maximum
                    Log::info('Proxy bidder in manual bid zone - skipping auto-bid', [
                        'user_id' => $proxyBid->user_id,
                        'max_bid_amount' => $proxyBid->max_bid_amount,
                        'current_bid_price' => $currentBidPrice,
                        'three_increments_before_max' => $threeIncrementsBeforeMax,
                        'reason' => 'At manual bid zone (three increments before maximum) - user should bid manually',
                    ]);
                    
                    // Send notification to user that they're in manual bid zone
                    try {
                        $auction = Auction::find($auctionId);
                        if ($auction) {
                            UserNotification::create([
                                'user_id' => $proxyBid->user_id,
                                'type' => 'proxy_bid_manual_zone',
                                'title' => 'Proxy Bid - Manual Bid Required',
                                'message' => "Your proxy bid for '{$auction->title}' is approaching your maximum (Rs. " . number_format($proxyBid->max_bid_amount, 2) . "). Current bid: Rs. " . number_format($currentBidPrice, 2) . ". Please bid manually if you want to continue.",
                                'metadata' => [
                                    'auction_id' => $auctionId,
                                    'max_bid_amount' => $proxyBid->max_bid_amount,
                                    'current_bid_price' => $currentBidPrice,
                                ],
                                'link' => "/auctions/{$auctionId}",
                                'is_read' => false,
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::error('Failed to send manual bid zone notification', [
                            'user_id' => $proxyBid->user_id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                    
                    // Skip this proxy bid - user needs to bid manually
                    // Continue to check other proxy bidders who might not be in manual bid zone
                    continue; // Skip this proxy bid, continue to next one
                } else {
                    // Zone 3: Normal case - bid the minimum needed to outbid
                    $proxyBidAmount = min($proxyBid->max_bid_amount, $nextMinimumBid);
                }
                
                // Only proceed if we have a valid bid amount and it's higher than current bid
                if (isset($proxyBidAmount) && $proxyBidAmount > $currentBidPrice && $proxyBidAmount <= $proxyBid->max_bid_amount) {
                    DB::beginTransaction();
                    
                    try {
                        // Mark previous winning bid as outbid
                        if ($currentBidderId) {
                            Bid::where('auction_id', $auctionId)
                                ->where('is_winning_bid', true)
                                ->update([
                                    'is_winning_bid' => false,
                                    'outbid_at' => now(),
                                ]);
                        }
                        
                        // Create auto-bid on behalf of proxy bidder
                        $autoBid = Bid::create([
                            'auction_id' => $auctionId,
                            'user_id' => $proxyBid->user_id,
                            'bid_amount' => $proxyBidAmount,
                            'max_bid_amount' => $proxyBid->max_bid_amount,
                            'is_proxy_bid' => true,
                            'is_winning_bid' => true,
                        ]);
                        
                        // Update auction
                        $auction->update([
                            'current_bid_price' => $proxyBidAmount,
                            'current_bidder_id' => $proxyBid->user_id,
                        ]);
                        
                        DB::commit();
                        
                        $processed++;
                        
                        Log::info('Proxy bid auto-placed', [
                            'auction_id' => $auctionId,
                            'proxy_bid_id' => $proxyBid->id,
                            'auto_bid_id' => $autoBid->id,
                            'user_id' => $proxyBid->user_id,
                            'bid_amount' => $proxyBidAmount,
                            'max_bid_amount' => $proxyBid->max_bid_amount,
                            'iteration' => $iteration,
                        ]);
                        
                        // Send notification to proxy bidder
                        try {
                            $this->sendBidPlacedNotification($proxyBid->user_id, $auction, $proxyBidAmount);
                        } catch (\Exception $e) {
                            Log::error('Failed to send proxy bid notification', [
                                'user_id' => $proxyBid->user_id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                        
                        // Continue loop to check if other proxy bids should now auto-bid
                        // (e.g., Person B's proxy bid after Person A auto-bids)
                        
                    } catch (\Exception $e) {
                        DB::rollBack();
                        Log::error('Failed to process proxy bid', [
                            'proxy_bid_id' => $proxyBid->id,
                            'error' => $e->getMessage(),
                        ]);
                        // Break on error to prevent infinite loop
                        break;
                    }
                } else {
                    // No valid proxy bid can be placed
                    break;
                }
            }
            
            // Reload auction one final time
            $auction = Auction::with(['currentBidder', 'bids'])->findOrFail($auctionId);
            
        } catch (\Exception $e) {
            Log::error('Failed to process proxy bids', [
                'auction_id' => $auctionId,
                'error' => $e->getMessage(),
            ]);
        }
        
        return [
            'processed' => $processed,
            'auction' => $auction ?? Auction::with(['currentBidder', 'bids'])->findOrFail($auctionId),
        ];
    }
    
    private function sendLoserNotifications(int $auctionId, int $winnerId): void
    {
        try {
            $losers = Bid::where('auction_id', $auctionId)
                ->where('user_id', '!=', $winnerId)
                ->distinct()
                ->pluck('user_id');
            
            $auction = Auction::find($auctionId);
            
            foreach ($losers as $loserId) {
                UserNotification::create([
                    'user_id' => $loserId,
                    'type' => 'auction_finished',
                    'title' => 'Auction ended',
                    'message' => "The auction '{$auction->title}' has ended. You did not win this auction.",
                    'metadata' => ['auction_id' => $auctionId],
                    'is_read' => false,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send loser notifications', ['auction_id' => $auctionId, 'error' => $e->getMessage()]);
        }
    }
    
    /**
     * Cancel an auction
     * Only allowed for pending or active auctions
     * Notifies all bidders and handles refunds if payment was made
     */
    public function cancelAuction(int $auctionId, ?string $reason = null): array
    {
        DB::beginTransaction();
        
        try {
            $auction = Auction::lockForUpdate()->findOrFail($auctionId);
            
            // Check if auction can be cancelled
            if (in_array($auction->status, ['ended', 'completed', 'cancelled'])) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => "Cannot cancel auction with status: {$auction->status}. Only pending or active auctions can be cancelled.",
                ];
            }
            
            Log::info('Cancelling auction', [
                'auction_id' => $auctionId,
                'current_status' => $auction->status,
                'reason' => $reason,
            ]);
            
            // Update auction status
            $auction->update([
                'status' => 'cancelled',
            ]);
            
            // Notify seller
            try {
                $this->sendAuctionCancelledNotification($auction->user_id, $auction, $reason);
            } catch (\Exception $e) {
                Log::error('Failed to send cancellation notification to seller', [
                    'auction_id' => $auctionId,
                    'error' => $e->getMessage(),
                ]);
            }
            
            // Notify all bidders
            try {
                $this->sendAuctionCancelledToBidders($auctionId, $auction, $reason);
            } catch (\Exception $e) {
                Log::error('Failed to send cancellation notifications to bidders', [
                    'auction_id' => $auctionId,
                    'error' => $e->getMessage(),
                ]);
            }
            
            // Handle refunds if payment was already made
            $refundResult = $this->handleCancellationRefunds($auctionId, $auction);
            
            DB::commit();
            
            return [
                'success' => true,
                'message' => 'Auction cancelled successfully',
                'auction' => $auction->fresh(['user', 'category', 'location']),
                'refunds' => $refundResult,
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to cancel auction', [
                'auction_id' => $auctionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to cancel auction: ' . $e->getMessage(),
            ];
        }
    }
    
    /**
     * Handle refunds for cancelled auction
     */
    private function handleCancellationRefunds(int $auctionId, Auction $auction): array
    {
        $refundResults = [];
        
        try {
            // Find completed transactions for this auction
            $transactions = Transaction::where('auction_id', $auctionId)
                ->where('status', 'completed')
                ->where('payment_method', 'paypal')
                ->get();
            
            foreach ($transactions as $transaction) {
                try {
                    // Get PayPal capture ID from payment_id (order ID)
                    $orderId = $transaction->payment_id;
                    
                    // Get order details to find capture ID
                    $order = $this->paypalService->getOrder($orderId);
                    
                    if ($order && isset($order['purchase_units'][0]['payments']['captures'][0]['id'])) {
                        $captureId = $order['purchase_units'][0]['payments']['captures'][0]['id'];
                        
                        // Process refund
                        $refund = $this->paypalService->refundPayment($captureId);
                        
                        if ($refund) {
                            // Update transaction status
                            $transaction->update([
                                'status' => 'refunded',
                            ]);
                            
                            $refundResults[] = [
                                'transaction_id' => $transaction->id,
                                'user_id' => $transaction->user_id,
                                'amount' => $transaction->amount,
                                'status' => 'refunded',
                                'refund_id' => $refund['id'] ?? null,
                            ];
                            
                            Log::info('Refund processed for cancelled auction', [
                                'auction_id' => $auctionId,
                                'transaction_id' => $transaction->id,
                                'refund_id' => $refund['id'] ?? null,
                            ]);
                        } else {
                            $refundResults[] = [
                                'transaction_id' => $transaction->id,
                                'user_id' => $transaction->user_id,
                                'amount' => $transaction->amount,
                                'status' => 'refund_failed',
                                'error' => 'PayPal refund failed',
                            ];
                            
                            Log::error('Failed to process refund', [
                                'auction_id' => $auctionId,
                                'transaction_id' => $transaction->id,
                            ]);
                        }
                    } else {
                        Log::warning('Could not find PayPal capture ID for refund', [
                            'auction_id' => $auctionId,
                            'transaction_id' => $transaction->id,
                            'payment_id' => $orderId,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Exception processing refund', [
                        'auction_id' => $auctionId,
                        'transaction_id' => $transaction->id,
                        'error' => $e->getMessage(),
                    ]);
                    
                    $refundResults[] = [
                        'transaction_id' => $transaction->id,
                        'user_id' => $transaction->user_id,
                        'amount' => $transaction->amount,
                        'status' => 'refund_error',
                        'error' => $e->getMessage(),
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to handle cancellation refunds', [
                'auction_id' => $auctionId,
                'error' => $e->getMessage(),
            ]);
        }
        
        return $refundResults;
    }
    
    /**
     * Send cancellation notification to seller
     */
    private function sendAuctionCancelledNotification(int $userId, Auction $auction, ?string $reason = null): void
    {
        try {
            $message = "Your auction '{$auction->title}' has been cancelled.";
            if ($reason) {
                $message .= " Reason: {$reason}";
            }
            
            UserNotification::create([
                'user_id' => $userId,
                'type' => 'auction_cancelled',
                'title' => 'Auction Cancelled',
                'message' => $message,
                'metadata' => ['auction_id' => $auction->id, 'reason' => $reason],
                'is_read' => false,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send cancellation notification to seller', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }
    
    /**
     * Send cancellation notifications to all bidders
     */
    private function sendAuctionCancelledToBidders(int $auctionId, Auction $auction, ?string $reason = null): void
    {
        try {
            // Get all unique bidders
            $bidders = Bid::where('auction_id', $auctionId)
                ->distinct()
                ->pluck('user_id');
            
            $message = "The auction '{$auction->title}' has been cancelled.";
            if ($reason) {
                $message .= " Reason: {$reason}";
            }
            $message .= " If you made a payment, a refund will be processed automatically.";
            
            foreach ($bidders as $bidderId) {
                try {
                    UserNotification::create([
                        'user_id' => $bidderId,
                        'type' => 'auction_cancelled',
                        'title' => 'Auction Cancelled',
                        'message' => $message,
                        'metadata' => ['auction_id' => $auctionId, 'reason' => $reason],
                        'is_read' => false,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send cancellation notification to bidder', [
                        'user_id' => $bidderId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Failed to send cancellation notifications to bidders', [
                'auction_id' => $auctionId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

