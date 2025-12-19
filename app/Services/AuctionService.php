<?php

namespace App\Services;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class AuctionService
{
    /**
     * Place a bid on an auction
     */
    public function placeBid(int $auctionId, int $userId, float $amount): array
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
            if ($previousBidderId) {
                Bid::where('auction_id', $auctionId)
                    ->where('is_winning_bid', true)
                    ->update([
                        'is_winning_bid' => false,
                        'outbid_at' => now(),
                    ]);
                
                // Send outbid notification to previous bidder
                $this->sendOutbidNotification($previousBidderId, $auction);
            }
            
            // Create new bid
            $bid = Bid::create([
                'auction_id' => $auctionId,
                'user_id' => $userId,
                'bid_amount' => $amount,
                'is_winning_bid' => true,
            ]);
            
            // Update auction
            $auction->update([
                'current_bid_price' => $amount,
                'current_bidder_id' => $userId,
            ]);
            
            // Send bid placed notification
            $this->sendBidPlacedNotification($userId, $auction, $amount);
            
            DB::commit();
            
            return [
                'valid' => true,
                'message' => 'Bid placed successfully',
                'bid' => $bid,
                'auction' => $auction->fresh(['currentBidder', 'bids']),
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
        
        // Check reserve price (if set)
        if ($auction->reserve_price && $amount < $auction->reserve_price) {
            return [
                'valid' => false,
                'message' => 'Bid does not meet reserve price',
            ];
        }
        
        return ['valid' => true];
    }
    
    /**
     * Determine winner of an auction
     */
    public function determineWinner(int $auctionId): array
    {
        DB::beginTransaction();
        
        try {
            $auction = Auction::lockForUpdate()->findOrFail($auctionId);
            
            // Get highest bid
            $highestBid = Bid::where('auction_id', $auctionId)
                ->where('is_winning_bid', true)
                ->orderBy('bid_amount', 'desc')
                ->first();
            
            if (!$highestBid) {
                return [
                    'success' => false,
                    'message' => 'No bids found for this auction',
                ];
            }
            
            // Check reserve price
            if ($auction->reserve_price && $highestBid->bid_amount < $auction->reserve_price) {
                // Reserve price not met
                $auction->update(['status' => 'ended']);
                
                DB::commit();
                
                return [
                    'success' => false,
                    'message' => 'Reserve price not met. Auction ended with no winner.',
                    'reserve_price' => $auction->reserve_price,
                    'highest_bid' => $highestBid->bid_amount,
                ];
            }
            
            // Update auction with winner
            $auction->update([
                'status' => 'ended',
                'winner_id' => $highestBid->user_id,
            ]);
            
            // Create bid_winner record (if table exists)
            if (DB::getSchemaBuilder()->hasTable('bid_winners')) {
                DB::table('bid_winners')->insert([
                    'user_id' => $highestBid->user_id,
                    'auction_id' => $auctionId,
                    'bidding_item' => $auction->title ?? 'Auction Item',
                    'bid_start_date' => $auction->start_time,
                    'bid_won_date' => now(),
                    'total_payment' => $highestBid->bid_amount,
                    'seller_id' => $auction->user_id,
                    'congratulation_email_sent' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            
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
                'auction' => $auction->fresh(['winner']),
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
        $auction = Auction::findOrFail($auctionId);
        
        if ($auction->isEnded()) {
            return [
                'success' => false,
                'message' => 'Auction has already ended',
            ];
        }
        
        // Update status
        $auction->update(['status' => 'ended']);
        
        // Determine winner
        return $this->determineWinner($auctionId);
    }
    
    /**
     * Calculate next minimum bid
     */
    public function calculateNextMinimumBid(Auction $auction): float
    {
        return $auction->getNextMinimumBid();
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
            UserNotification::create([
                'user_id' => $userId,
                'type' => 'auction_won',
                'title' => 'Congratulations! You won the auction',
                'message' => "You won the auction for '{$auction->title}'. Please complete payment to claim your item.",
                'metadata' => ['auction_id' => $auction->id],
                'is_read' => false,
            ]);
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
                    'type' => 'auction_lost',
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
}

