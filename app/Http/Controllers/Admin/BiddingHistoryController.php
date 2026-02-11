<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BiddingHistory;
use App\Models\Auction;
use App\Models\Bid;
use Illuminate\Http\Request;

class BiddingHistoryController extends Controller
{
  public function index()
  {
    // Get all auctions that have bids (from bids table)
    $auctionsWithBids = Auction::whereHas('bids')
      ->with(['bids' => function ($query) {
        $query->orderBy('created_at', 'desc');
      }])
      ->get();

    // Get all bidding history records grouped by auction
    // Since bidding_history.start_date_time is set to auction.start_time (not bid timestamp),
    // we need to match bidding_history records with bids differently
    // Strategy: Match by creation order (bidding_history.id order matches bid creation order)
    $biddingHistoryByAuction = BiddingHistory::with(['user', 'auction'])
      ->orderBy('id', 'asc') // Order by ID to match creation order
      ->get()
      ->groupBy(function ($history) {
        return $history->user_id . '_' . $history->auction_id;
      })
      ->map(function ($userAuctionHistory) {
        // For each user+auction combination, get all their bids in creation order
        $firstHistory = $userAuctionHistory->first();
        $bids = Bid::where('user_id', $firstHistory->user_id)
          ->where('auction_id', $firstHistory->auction_id)
          ->orderBy('id', 'asc') // Order by ID to match creation order
          ->get();
        
        // Match bidding_history records with bids by index position
        // Since both are created in the same transaction and order, they should match
        return $userAuctionHistory->map(function ($history, $index) use ($bids) {
          $matchedBid = $bids->get($index);
          
          // Add bid_amount to the history object
          $history->bid_amount = $matchedBid ? $matchedBid->bid_amount : null;
          $history->bid_created_at = $matchedBid ? $matchedBid->created_at : null;
          $history->bid_id = $matchedBid ? $matchedBid->id : null;
          
          return $history;
        });
      })
      ->flatten()
      // Sort by time (most recent first) - use bid_created_at if available, otherwise start_date_time
      ->sortByDesc(function ($history) {
        return $history->bid_created_at 
          ? strtotime($history->bid_created_at) 
          : strtotime($history->start_date_time);
      })
      ->values()
      // Group by auction_id
      ->groupBy('auction_id');

    // Build grouped data - include ALL auctions with bids, even if no bidding_history
    $groupedByAuction = $auctionsWithBids->map(function ($auction) use ($biddingHistoryByAuction) {
      $auctionId = $auction->id;
      $biddingHistory = $biddingHistoryByAuction->get($auctionId, collect());
      
      return [
        'auction_id' => $auctionId,
        'auction_title' => $auction->title ?? 'Unknown Auction',
        'auction' => $auction,
        'bidding_history' => $biddingHistory->take(50)->values(), // Last 50 records
        'total_count' => $biddingHistory->count(),
        'bid_count' => $auction->bids()->count(), // Total bids from bids table
      ];
    })->values();

    // Flatten for backward compatibility (already deduplicated and sorted)
    $biddingHistory = $biddingHistoryByAuction
      ->flatten()
      ->sortByDesc(function ($history) {
        // Use bid_created_at if available, otherwise start_date_time
        return $history->bid_created_at 
          ? strtotime($history->bid_created_at) 
          : strtotime($history->start_date_time);
      })
      ->take(50)
      ->values();

    return response()->json([
      'grouped' => $groupedByAuction,
      'flat' => $biddingHistory, // Keep flat for backward compatibility
    ]);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'user_id' => 'required|exists:users,id',
      'auction_id' => 'required|exists:auctions,id',
      'item_name' => 'required|string|max:255',
      'reserve_price' => 'required|numeric|min:0',
      'buy_now_price' => 'required|numeric|min:0',
      'payment_method' => 'required|string|max:255',
      'start_date_time' => 'required|date',
    ]);

    $biddingHistory = BiddingHistory::create($validated);

    return response()->json($biddingHistory, 201);
  }

  public function show(string $id)
  {
    $biddingHistory = BiddingHistory::with(['user', 'auction'])->findOrFail($id);
    return response()->json($biddingHistory);
  }

  public function update(Request $request, string $id)
  {
    $biddingHistory = BiddingHistory::findOrFail($id);

    $validated = $request->validate([
      'user_id' => 'sometimes|exists:users,id',
      'auction_id' => 'sometimes|exists:auctions,id',
      'item_name' => 'sometimes|string|max:255',
      'reserve_price' => 'sometimes|numeric|min:0',
      'buy_now_price' => 'sometimes|numeric|min:0',
      'payment_method' => 'sometimes|string|max:255',
      'start_date_time' => 'sometimes|date',
    ]);

    $biddingHistory->update($validated);

    return response()->json($biddingHistory);
  }

  public function destroy(string $id)
  {
    $biddingHistory = BiddingHistory::find($id);
    
    if (!$biddingHistory) {
      return response()->json([
        'message' => 'Bidding history not found. It may have already been deleted.'
      ], 404);
    }
    
    $biddingHistory->delete();

    return response()->json(['message' => 'Bidding history deleted successfully']);
  }
}
