<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use Illuminate\Http\Request;

class AuctionController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index()
  {
    $auctions = Auction::with(['user', 'currentBidder'])
      ->orderBy('updated_at', 'desc')
      ->get();

    return response()->json($auctions);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request)
  {
    $validated = $request->validate([
      'user_id' => 'required|exists:users,id',
      'category_id' => 'required|exists:categories,id',
      'title' => 'required|string|max:255',
      'description' => 'required|string',
      'starting_price' => 'required|numeric|min:0',
      'reserve_price' => 'nullable|numeric|min:0',
      'buy_now_price' => 'nullable|numeric|min:0',
      'current_bid_price' => 'nullable|numeric|min:0',
      'current_bidder_id' => 'nullable|exists:users,id',
      'start_date_time' => 'required|date',
      'end_date_time' => 'required|date|after:start_date_time',
    ]);

    $auction = Auction::create($validated);

    return response()->json($auction, 201);
  }

  /**
   * Display the specified resource.
   */
  public function show(string $id)
  {
    $auction = Auction::with(['user', 'currentBidder', 'category'])->findOrFail($id);
    return response()->json($auction);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, string $id)
  {
    $auction = Auction::findOrFail($id);

    $validated = $request->validate([
      'user_id' => 'sometimes|exists:users,id',
      'category_id' => 'sometimes|exists:categories,id',
      'title' => 'sometimes|string|max:255',
      'description' => 'sometimes|string',
      'starting_price' => 'sometimes|numeric|min:0',
      'reserve_price' => 'sometimes|numeric|min:0',
      'buy_now_price' => 'sometimes|numeric|min:0',
      'current_bid_price' => 'sometimes|numeric|min:0',
      'current_bidder_id' => 'sometimes|exists:users,id',
      'start_date_time' => 'sometimes|date',
      'end_date_time' => 'sometimes|date|after:start_date_time',
    ]);

    $auction->update($validated);

    return response()->json($auction);
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(string $id)
  {
    $auction = Auction::findOrFail($id);
    $auction->delete();

    return response()->json(['message' => 'Auction deleted successfully']);
  }
}
