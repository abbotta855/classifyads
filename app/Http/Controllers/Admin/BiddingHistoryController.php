<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BiddingHistory;
use Illuminate\Http\Request;

class BiddingHistoryController extends Controller
{
  public function index()
  {
    $biddingHistory = BiddingHistory::with(['user', 'auction'])
      ->orderBy('start_date_time', 'desc')
      ->get();

    return response()->json($biddingHistory);
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
    $biddingHistory = BiddingHistory::findOrFail($id);
    $biddingHistory->delete();

    return response()->json(['message' => 'Bidding history deleted successfully']);
  }
}
