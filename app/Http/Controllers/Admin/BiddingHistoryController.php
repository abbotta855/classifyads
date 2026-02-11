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
    $biddingHistoryByAuction = BiddingHistory::with(['user', 'auction'])
      ->orderBy('start_date_time', 'desc')
      ->get()
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

    // Flatten for backward compatibility
    $biddingHistory = $biddingHistoryByAuction
      ->flatten()
      ->sortByDesc('start_date_time')
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
