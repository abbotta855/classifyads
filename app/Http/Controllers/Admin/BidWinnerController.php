<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BidWinner;
use App\Models\Auction;
use App\Models\Bid;
use App\Services\AuctionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BidWinnerController extends Controller
{
  public function index()
  {
    $bidWinners = BidWinner::with(['user', 'auction', 'seller'])
      ->orderBy('bid_won_date', 'desc')
      ->get();

    return response()->json($bidWinners);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'user_id' => 'required|exists:users,id',
      'auction_id' => 'required|exists:auctions,id',
      'bidding_item' => 'required|string|max:255',
      'bid_start_date' => 'required|date',
      'bid_won_date' => 'required|date',
      'payment_proceed_date' => 'required|date',
      'total_payment' => 'required|numeric|min:0',
      'seller_id' => 'required|exists:users,id',
      'congratulation_email_sent' => 'boolean',
    ]);

    $bidWinner = BidWinner::create($validated);

    return response()->json($bidWinner, 201);
  }

  public function show(string $id)
  {
    $bidWinner = BidWinner::with(['user', 'auction', 'seller'])->findOrFail($id);
    return response()->json($bidWinner);
  }

  public function update(Request $request, string $id)
  {
    $bidWinner = BidWinner::findOrFail($id);

    $validated = $request->validate([
      'user_id' => 'sometimes|exists:users,id',
      'auction_id' => 'sometimes|exists:auctions,id',
      'bidding_item' => 'sometimes|string|max:255',
      'bid_start_date' => 'sometimes|date',
      'bid_won_date' => 'sometimes|date',
      'payment_proceed_date' => 'sometimes|date',
      'total_payment' => 'sometimes|numeric|min:0',
      'seller_id' => 'sometimes|exists:users,id',
      'congratulation_email_sent' => 'sometimes|boolean',
    ]);

    $bidWinner->update($validated);

    return response()->json($bidWinner);
  }

  public function destroy(string $id)
  {
    $bidWinner = BidWinner::findOrFail($id);
    $bidWinner->delete();

    return response()->json(['message' => 'Bid winner deleted successfully']);
  }

  /**
   * Backfill missing BidWinner and BiddingTracking records for ended auctions.
   * This is callable from the admin panel without needing CLI access.
   */
  public function backfill(Request $request, AuctionService $auctionService)
  {
    $created = 0;
    $skipped = 0;
    $failed = 0;
    $details = [];

    try {
      // Find ended auctions that have bids but no BidWinner record
      $endedAuctions = Auction::where('status', 'ended')
        ->whereHas('bids')
        ->get();

      foreach ($endedAuctions as $auction) {
        try {
          // Check if BidWinner already exists for this auction
          $existingWinner = BidWinner::where('auction_id', $auction->id)->first();
          
          // Determine the winner
          $winnerId = $auction->winner_id;
          if (!$winnerId) {
            $highestBid = Bid::where('auction_id', $auction->id)
              ->orderBy('bid_amount', 'desc')
              ->first();
            if ($highestBid) {
              $winnerId = $highestBid->user_id;
              // Also set winner_id on the auction
              $auction->update(['winner_id' => $winnerId]);
            }
          }

          if (!$winnerId) {
            $skipped++;
            $details[] = "Auction #{$auction->id} '{$auction->title}': Skipped - no bids/winner";
            continue;
          }

          if ($existingWinner) {
            // BidWinner exists, check if BiddingTracking also exists
            $existingTracking = \App\Models\BiddingTracking::where('bid_winner_id', $existingWinner->id)->first();
            if ($existingTracking) {
              $skipped++;
              $details[] = "Auction #{$auction->id} '{$auction->title}': Skipped - records already exist";
              continue;
            }
          }

          // Create records using the service
          $auctionService->recordWinnerTracking($auction, $winnerId);
          $created++;
          $details[] = "Auction #{$auction->id} '{$auction->title}': Created records for winner #{$winnerId}";

        } catch (\Exception $e) {
          $failed++;
          $details[] = "Auction #{$auction->id} '{$auction->title}': Failed - {$e->getMessage()}";
          Log::error('Backfill failed for auction', [
            'auction_id' => $auction->id,
            'error' => $e->getMessage(),
          ]);
        }
      }
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Backfill failed: ' . $e->getMessage(),
        'created' => $created,
        'skipped' => $skipped,
        'failed' => $failed,
        'details' => $details,
      ], 500);
    }

    return response()->json([
      'message' => "Backfill complete: {$created} created, {$skipped} skipped, {$failed} failed",
      'created' => $created,
      'skipped' => $skipped,
      'failed' => $failed,
      'details' => $details,
    ]);
  }
}
