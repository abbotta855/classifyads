<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\AuctionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class AuctionController extends Controller
{
  protected AuctionService $auctionService;

  public function __construct(AuctionService $auctionService)
  {
    $this->auctionService = $auctionService;
  }

  /**
   * Display a listing of the resource.
   */
  public function index(Request $request)
  {
    $query = Auction::with(['user', 'currentBidder', 'category', 'location', 'winner']);

    // Filter by status
    if ($request->has('status')) {
      $query->where('status', $request->status);
    }

    // Search
    if ($request->has('search')) {
      $search = $request->search;
      $query->where(function($q) use ($search) {
        $q->where('title', 'like', "%{$search}%")
          ->orWhere('description', 'like', "%{$search}%");
      });
    }

    $auctions = $query->orderBy('created_at', 'desc')->paginate(40);

    // Transform data (reuse AdminPanel pattern)
    $transformedAuctions = $auctions->getCollection()->map(function ($auction) {
      return [
        'id' => $auction->id,
        'slug' => $auction->slug,
        'title' => $auction->title,
        'description' => $auction->description,
        'user' => $auction->user ? [
          'id' => $auction->user->id,
          'name' => $auction->user->name,
        ] : null,
        'category' => $auction->category ? $auction->category->category : null,
        'starting_price' => (float) $auction->starting_price,
        'current_bid_price' => (float) ($auction->current_bid_price ?? $auction->starting_price),
        'bid_count' => $auction->getBidCount(),
        'status' => $auction->status,
        'start_time' => $auction->start_time->toIso8601String(),
        'end_time' => $auction->end_time->toIso8601String(),
        'winner' => $auction->winner ? [
          'id' => $auction->winner->id,
          'name' => $auction->winner->name,
        ] : null,
        'views' => $auction->views ?? 0,
        'created_at' => $auction->created_at ? $auction->created_at->toIso8601String() : null,
      ];
    });

    return response()->json([
      'auctions' => $transformedAuctions,
      'current_page' => $auctions->currentPage(),
      'last_page' => $auctions->lastPage(),
      'per_page' => $auctions->perPage(),
      'total' => $auctions->total(),
    ]);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request)
  {
    $validated = $request->validate([
      'user_id' => 'required|exists:users,id',
      'category_id' => 'required|exists:categories,id',
      'location_id' => 'nullable|exists:locations,id',
      'title' => 'required|string|max:255',
      'description' => 'required|string',
      'starting_price' => 'required|numeric|min:0',
      'reserve_price' => 'nullable|numeric|min:0',
      'buy_now_price' => 'nullable|numeric|min:0',
      'bid_increment' => 'nullable|numeric|min:0.01',
      'start_time' => 'required|date',
      'end_time' => 'required|date|after:start_time',
      'images' => 'nullable|array|max:4',
      'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240', // Max 10MB per image
      'ad_id' => 'nullable|exists:ads,id', // Optional: link to existing ad
    ]);

    try {
      // Handle image uploads (reuse ad image pattern)
      $imageUrls = [null, null, null, null];
      
      if ($request->hasFile('images')) {
        $images = $request->file('images');
        
        foreach ($images as $index => $image) {
          if ($image && $image->isValid() && $index < 4) {
            $path = $image->store('auctions/photos', 'public');
            $imageUrls[$index] = Storage::url($path);
          }
        }
      }

      // Generate slug (reuse ad slug pattern)
      $slug = Auction::generateSlug($validated['title']);

      // Determine initial status
      $status = 'pending';
      if (now() >= $validated['start_time']) {
        $status = 'active';
      }

      // Create auction
      $auction = Auction::create([
        'user_id' => $validated['user_id'],
        'category_id' => $validated['category_id'],
        'location_id' => $validated['location_id'] ?? null,
        'ad_id' => $validated['ad_id'] ?? null,
        'title' => $validated['title'],
        'description' => $validated['description'],
        'slug' => $slug,
        'starting_price' => $validated['starting_price'],
        'reserve_price' => $validated['reserve_price'] ?? null,
        'buy_now_price' => $validated['buy_now_price'] ?? null,
        'bid_increment' => $validated['bid_increment'] ?? 1.00,
        'start_time' => $validated['start_time'],
        'end_time' => $validated['end_time'],
        'status' => $status,
        'image1_url' => $imageUrls[0],
        'image2_url' => $imageUrls[1],
        'image3_url' => $imageUrls[2],
        'image4_url' => $imageUrls[3],
        'views' => 0,
      ]);

      $auction->load(['user', 'category', 'location']);

      // Send notification to all users about new auction (optional - can be limited to category interests)
      try {
          $this->sendNewAuctionNotification($auction);
      } catch (\Exception $e) {
          Log::error('Failed to send new auction notification', ['auction_id' => $auction->id, 'error' => $e->getMessage()]);
      }

      return response()->json($auction, 201);
    } catch (\Illuminate\Validation\ValidationException $e) {
      // Return validation errors in a more readable format
      $errors = $e->errors();
      $errorMessages = [];
      foreach ($errors as $field => $messages) {
        $errorMessages[] = implode(', ', $messages);
      }
      
      return response()->json([
        'error' => 'Validation failed',
        'message' => implode(' ', $errorMessages),
        'errors' => $errors,
      ], 422);
    } catch (\Exception $e) {
      Log::error('Failed to create auction', [
        'error' => $e->getMessage(),
        'request' => $request->all(),
      ]);
      
      return response()->json([
        'error' => 'Failed to create auction',
        'message' => $e->getMessage(),
      ], 500);
    }
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
      'location_id' => 'sometimes|exists:locations,id',
      'title' => 'sometimes|string|max:255',
      'description' => 'sometimes|string',
      'starting_price' => 'sometimes|numeric|min:0',
      'reserve_price' => 'sometimes|numeric|min:0',
      'buy_now_price' => 'sometimes|numeric|min:0',
      'bid_increment' => 'sometimes|numeric|min:0.01',
      'start_time' => 'sometimes|date',
      'end_time' => 'sometimes|date|after:start_time',
      'status' => 'sometimes|in:pending,active,ended,completed,cancelled',
      'images' => 'sometimes|array|max:4',
      'images.*' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:10240', // Max 10MB per image
    ]);

    try {
      // Handle image uploads if provided
      if ($request->hasFile('images')) {
        $images = $request->file('images');
        $imageUrls = [
          $auction->image1_url,
          $auction->image2_url,
          $auction->image3_url,
          $auction->image4_url,
        ];
        
        foreach ($images as $index => $image) {
          if ($image && $image->isValid() && $index < 4) {
            $path = $image->store('auctions/photos', 'public');
            $imageUrls[$index] = Storage::url($path);
          }
        }
        
        $validated['image1_url'] = $imageUrls[0];
        $validated['image2_url'] = $imageUrls[1];
        $validated['image3_url'] = $imageUrls[2];
        $validated['image4_url'] = $imageUrls[3];
      }

      // Regenerate slug if title changed
      if (isset($validated['title']) && $validated['title'] !== $auction->title) {
        $validated['slug'] = Auction::generateSlug($validated['title'], $auction->id);
      }

      $auction->update($validated);
      $auction->load(['user', 'category', 'location', 'currentBidder', 'winner']);

      return response()->json($auction);
    } catch (\Exception $e) {
      Log::error('Failed to update auction', [
        'auction_id' => $id,
        'error' => $e->getMessage(),
      ]);
      
      return response()->json([
        'error' => 'Failed to update auction',
        'message' => $e->getMessage(),
      ], 500);
    }
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

  /**
   * Manually end an auction
   */
  public function endAuction(string $id)
  {
    try {
      $result = $this->auctionService->endAuction($id);
      
      if (!$result['success']) {
        return response()->json([
          'error' => $result['message'],
        ], 400);
      }

      return response()->json([
        'message' => 'Auction ended successfully',
        'auction' => $result['auction'],
        'winner' => $result['winner'] ?? null,
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'error' => 'Failed to end auction',
        'message' => $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Determine winner of an auction
   */
  public function determineWinner(string $id)
  {
    try {
      $result = $this->auctionService->determineWinner($id);
      
      if (!$result['success']) {
        return response()->json([
          'error' => $result['message'],
        ], 400);
      }

      return response()->json([
        'message' => 'Winner determined successfully',
        'winner' => $result['winner'],
        'winning_bid' => $result['winning_bid'],
        'auction' => $result['auction'],
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'error' => 'Failed to determine winner',
        'message' => $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Send notification to all users about a new auction
   */
  private function sendNewAuctionNotification(Auction $auction): void
  {
    try {
      // Get all active users (excluding the auction creator)
      $users = User::where('id', '!=', $auction->user_id)
        ->whereNotNull('email')
        ->get();

      foreach ($users as $user) {
        UserNotification::create([
          'user_id' => $user->id,
          'type' => 'new_auction',
          'title' => 'New Auction Available',
          'message' => "A new auction has started: '{$auction->title}'. Starting price: Rs. " . number_format($auction->starting_price, 2),
          'metadata' => ['auction_id' => $auction->id],
          'is_read' => false,
        ]);
      }
    } catch (\Exception $e) {
      Log::error('Failed to send new auction notifications', ['auction_id' => $auction->id, 'error' => $e->getMessage()]);
    }
  }
}
