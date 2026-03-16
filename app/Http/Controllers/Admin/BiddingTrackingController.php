<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BiddingTracking;
use Illuminate\Http\Request;

class BiddingTrackingController extends Controller
{
  public function index()
  {
    $biddingTracking = BiddingTracking::with('bidWinner')
      ->orderBy('complete_process_date_time', 'desc')
      ->get();

    return response()->json($biddingTracking);
  }

  public function store(Request $request)
  {
    $validated = $request->validate([
      'bid_winner_id' => 'required|exists:bid_winners,id',
      'bid_winner_name' => 'required|string|max:255',
      'bid_won_item_name' => 'required|string|max:255',
      'payment_status' => 'required|in:Pending,Completed,Failed',
      'pickup_status' => 'required|in:Not Started,Scheduled,Pending,Picked Up',
      'complete_process_date_time' => 'nullable|date',
      'alert_sent' => 'boolean',
    ]);

    $biddingTracking = BiddingTracking::create($validated);

    return response()->json($biddingTracking, 201);
  }

  public function show(string $id)
  {
    $biddingTracking = BiddingTracking::with('bidWinner')->findOrFail($id);
    return response()->json($biddingTracking);
  }

  public function update(Request $request, string $id)
  {
    $biddingTracking = BiddingTracking::findOrFail($id);

    $validated = $request->validate([
      'bid_winner_id' => 'sometimes|exists:bid_winners,id',
      'bid_winner_name' => 'sometimes|string|max:255',
      'bid_won_item_name' => 'sometimes|string|max:255',
      'payment_status' => 'sometimes|in:Pending,Completed,Failed',
      'pickup_status' => 'sometimes|in:Not Started,Scheduled,Pending,Picked Up',
      'complete_process_date_time' => 'sometimes|date',
      'alert_sent' => 'sometimes|boolean',
    ]);

    $biddingTracking->update($validated);

    return response()->json($biddingTracking);
  }

  public function destroy(string $id)
  {
    $biddingTracking = BiddingTracking::findOrFail($id);
    $biddingTracking->delete();

    return response()->json(['message' => 'Bidding tracking deleted successfully']);
  }
}
