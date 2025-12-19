<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Bid;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserAuctionController extends Controller
{
    /**
     * Get all auctions created by the authenticated user
     */
    public function myAuctions()
    {
        $auctions = Auction::with(['category', 'location', 'currentBidder', 'winner'])
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($auction) {
                // Get primary image (use first available image)
                $image = $auction->image1_url 
                    ?? $auction->image2_url 
                    ?? $auction->image3_url 
                    ?? $auction->image4_url
                    ?? 'https://via.placeholder.com/300x300?text=No+Image';

                return [
                    'id' => $auction->id,
                    'slug' => $auction->slug,
                    'title' => $auction->title,
                    'description' => $auction->description,
                    'category' => $auction->category ? $auction->category->category : null,
                    'location' => $auction->location ? $auction->location->name : null,
                    'starting_price' => (float) $auction->starting_price,
                    'current_bid_price' => (float) ($auction->current_bid_price ?? $auction->starting_price),
                    'bid_count' => $auction->getBidCount(),
                    'status' => $auction->status,
                    'is_active' => $auction->isActive(),
                    'start_time' => $auction->start_time->toIso8601String(),
                    'end_time' => $auction->end_time->toIso8601String(),
                    'time_remaining' => $auction->getTimeRemaining(),
                    'winner' => $auction->winner ? [
                        'id' => $auction->winner->id,
                        'name' => $auction->winner->name,
                    ] : null,
                    'views' => $auction->views ?? 0,
                    'image' => $image,
                    'image1_url' => $auction->image1_url,
                    'image2_url' => $auction->image2_url,
                    'image3_url' => $auction->image3_url,
                    'image4_url' => $auction->image4_url,
                    'created_at' => $auction->created_at ? $auction->created_at->toIso8601String() : null,
                ];
            });

        return response()->json($auctions);
    }

    /**
     * Get all bids placed by the authenticated user
     */
    public function myBids()
    {
        $bids = Bid::with(['auction.category', 'auction.location', 'auction.currentBidder'])
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('auction_id')
            ->map(function ($bidsGroup) {
                $auction = $bidsGroup->first()->auction;
                $highestBid = $bidsGroup->sortByDesc('bid_amount')->first();
                
                return [
                    'auction' => [
                        'id' => $auction->id,
                        'slug' => $auction->slug,
                        'title' => $auction->title,
                        'category' => $auction->category ? $auction->category->category : null,
                        'location' => $auction->location ? $auction->location->name : null,
                        'image' => $auction->image1_url ?? 'https://via.placeholder.com/1200x1200?text=No+Image',
                        'status' => $auction->status,
                        'is_active' => $auction->isActive(),
                        'end_time' => $auction->end_time->toIso8601String(),
                        'time_remaining' => $auction->getTimeRemaining(),
                    ],
                    'my_bids' => $bidsGroup->map(function ($bid) {
                        return [
                            'id' => $bid->id,
                            'bid_amount' => (float) $bid->bid_amount,
                            'is_winning' => $bid->is_winning_bid,
                            'outbid' => !$bid->is_winning_bid,
                            'created_at' => $bid->created_at->toIso8601String(),
                        ];
                    })->values(),
                    'my_highest_bid' => [
                        'amount' => (float) $highestBid->bid_amount,
                        'is_winning' => $highestBid->is_winning_bid,
                    ],
                    'current_bid' => (float) ($auction->current_bid_price ?? $auction->starting_price),
                ];
            })
            ->values();

        return response()->json($bids);
    }

    /**
     * Get all auctions won by the authenticated user
     */
    public function wonAuctions()
    {
        $auctions = Auction::with(['category', 'location', 'user'])
            ->where('winner_id', Auth::id())
            ->where('status', 'ended')
            ->orderBy('end_time', 'desc')
            ->get()
            ->map(function ($auction) {
                $winningBid = $auction->bids()
                    ->where('user_id', Auth::id())
                    ->where('is_winning_bid', true)
                    ->first();
                
                $paymentCompleted = $auction->payment_completed_at !== null;
                
                return [
                    'id' => $auction->id,
                    'slug' => $auction->slug,
                    'title' => $auction->title,
                    'description' => $auction->description,
                    'category' => $auction->category ? $auction->category->category : null,
                    'location' => $auction->location ? $auction->location->name : null,
                    'image' => $auction->image1_url ?? 'https://via.placeholder.com/1200x1200?text=No+Image',
                    'winning_bid_amount' => $winningBid ? (float) $winningBid->bid_amount : null,
                    'payment_completed' => $paymentCompleted,
                    'payment_completed_at' => $auction->payment_completed_at ? $auction->payment_completed_at->toIso8601String() : null,
                    'seller' => $auction->user ? [
                        'id' => $auction->user->id,
                        'name' => $auction->user->name,
                    ] : null,
                    'end_time' => $auction->end_time->toIso8601String(),
                    'won_at' => $auction->updated_at->toIso8601String(),
                ];
            });

        return response()->json($auctions);
    }
}
