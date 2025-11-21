<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BidWinner;
use Illuminate\Http\Request;

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
}
