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
   * Get only auction statuses (lightweight endpoint for real-time updates)
   * Returns statuses and time until next status change for smart polling
   */
  public function statuses(Request $request)
  {
    try {
      $query = Auction::select('id', 'start_time', 'end_time', 'status');
      
      // Filter by IDs if provided (for specific auctions)
      // Handle both array format (ids[]=15) and comma-separated string (ids=15,16)
      if ($request->has('ids')) {
        $ids = $request->input('ids');
        
        // Handle array format from axios: ids[]=15 or ids=15,16
        if (is_array($ids)) {
          $ids = array_filter(array_map('intval', $ids));
        } elseif (is_string($ids)) {
          $ids = array_filter(array_map('intval', explode(',', $ids)));
        } else {
          $ids = [];
        }
        
        if (!empty($ids)) {
          $query->whereIn('id', $ids);
        }
      }
      
      $auctions = $query->get();
      
      $now = now();
      $statusesToUpdate = [];
      
      $result = $auctions->map(function ($auction) use ($now, &$statusesToUpdate) {
        // Calculate actual status based on current time
        $actualStatus = $auction->status;
        $nextUpdateTime = null;
        $secondsUntilNextChange = null;
        
        if ($auction->status === 'completed') {
          $actualStatus = 'completed';
          // No need to update completed auctions
        } elseif ($auction->end_time <= $now) {
          $actualStatus = 'ended';
          // Update database if status changed
          if ($auction->status !== 'ended' && $auction->status !== 'completed') {
            $statusesToUpdate[$auction->id] = 'ended';
          }
        } elseif ($auction->start_time <= $now && $auction->end_time > $now) {
          $actualStatus = 'active';
          // Update database if status changed from pending to active
          if ($auction->status === 'pending') {
            $statusesToUpdate[$auction->id] = 'active';
          }
          // Active: next change is when it ends
          $nextUpdateTime = $auction->end_time;
          $secondsUntilNextChange = max(1, $auction->end_time->diffInSeconds($now));
        } elseif ($auction->start_time > $now) {
          $actualStatus = 'pending';
          // Pending: next change is when it starts
          $nextUpdateTime = $auction->start_time;
          $secondsUntilNextChange = max(1, $auction->start_time->diffInSeconds($now));
        }
        
        return [
          'id' => $auction->id,
          'status' => $actualStatus,
          'next_update_time' => $nextUpdateTime ? $nextUpdateTime->toIso8601String() : null,
          'seconds_until_change' => $secondsUntilNextChange,
        ];
      });
      
      // Update database statuses in batch for auctions that changed
      if (!empty($statusesToUpdate)) {
        foreach ($statusesToUpdate as $auctionId => $newStatus) {
          Auction::where('id', $auctionId)->update(['status' => $newStatus]);
        }
      }
      
      // Calculate recommended update interval based on closest status change
      $activeAuctions = $result->filter(fn($a) => in_array($a['status'], ['pending', 'active']));
      $recommendedInterval = 10; // Default 10 seconds
      
      if ($activeAuctions->isNotEmpty()) {
        $closestChange = $activeAuctions->min('seconds_until_change');
        if ($closestChange !== null) {
          // If status change is within 1 minute, update every 1 second for exact timing
          if ($closestChange <= 60) {
            $recommendedInterval = 1;
          }
          // If status change is within 5 minutes, update every 5 seconds
          elseif ($closestChange <= 300) {
            $recommendedInterval = 5;
          }
          // Otherwise, update every 10 seconds
          else {
            $recommendedInterval = 10;
          }
        }
      }
      
      return response()->json([
        'statuses' => $result->pluck('status', 'id'),
        'recommended_interval' => $recommendedInterval, // In seconds
        'details' => $result->keyBy('id'), // Full details for frontend logic
      ]);
    } catch (\Exception $e) {
      Log::error('Error in statuses endpoint: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'request' => $request->all(),
      ]);
      return response()->json([
        'error' => 'Failed to fetch auction statuses',
        'message' => $e->getMessage(),
      ], 500);
    }
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
      // Calculate actual status based on times (not just database status)
      // This ensures admin sees correct status even if scheduled commands haven't run
      $actualStatus = $auction->status;
      $now = now();
      
      // Don't override 'completed' status (payment already done)
      if ($auction->status === 'completed') {
        $actualStatus = 'completed';
      } elseif ($auction->end_time <= $now) {
        // Auction has already ended
        $actualStatus = 'ended';
      } elseif ($auction->start_time <= $now && $auction->end_time > $now) {
        // Auction has started but not ended
        $actualStatus = 'active';
      } elseif ($auction->start_time > $now) {
        // Auction hasn't started yet
        $actualStatus = 'pending';
      }
      
      return [
        'id' => $auction->id,
        'slug' => $auction->slug,
        'title' => $auction->title,
        'description' => $auction->description,
        'user' => $auction->user ? [
          'id' => $auction->user->id,
          'name' => $auction->user->name,
        ] : null,
        'category_id' => $auction->category_id,
        'category' => $auction->category ? $auction->category->category : null,
        'location_id' => $auction->location_id,
        'reserve_price' => $auction->reserve_price ? (float) $auction->reserve_price : null,
        'buy_now_price' => $auction->buy_now_price ? (float) $auction->buy_now_price : null,
        'bid_increment' => (float) $auction->bid_increment,
        'starting_price' => (float) $auction->starting_price,
        'current_bid_price' => (float) ($auction->current_bid_price ?? $auction->starting_price),
        'bid_count' => $auction->getBidCount(),
        'status' => $actualStatus, // Use calculated status
        'db_status' => $auction->status, // Keep original for reference
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

    // Validate price relationships
    $startingPrice = (float) $validated['starting_price'];
    $reservePrice = isset($validated['reserve_price']) ? (float) $validated['reserve_price'] : null;
    $buyNowPrice = isset($validated['buy_now_price']) ? (float) $validated['buy_now_price'] : null;

    // Reserve price must be >= starting price
    if ($reservePrice !== null && $reservePrice < $startingPrice) {
      return response()->json([
        'error' => 'Validation failed',
        'message' => 'Reserve price must be greater than or equal to starting price.',
        'errors' => [
          'reserve_price' => ['Reserve price must be greater than or equal to starting price.'],
        ],
      ], 422);
    }

    // Buy now price must be >= starting price
    if ($buyNowPrice !== null && $buyNowPrice < $startingPrice) {
      return response()->json([
        'error' => 'Validation failed',
        'message' => 'Buy now price must be greater than or equal to starting price.',
        'errors' => [
          'buy_now_price' => ['Buy now price must be greater than or equal to starting price.'],
        ],
      ], 422);
    }

    // Buy now price must be >= reserve price (if both provided)
    if ($buyNowPrice !== null && $reservePrice !== null && $buyNowPrice < $reservePrice) {
      return response()->json([
        'error' => 'Validation failed',
        'message' => 'Buy now price must be greater than or equal to reserve price.',
        'errors' => [
          'buy_now_price' => ['Buy now price must be greater than or equal to reserve price.'],
        ],
      ], 422);
    }

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

      // Determine initial status based on current time vs start_time and end_time
      $now = now();
      $startTime = \Carbon\Carbon::parse($validated['start_time']);
      $endTime = \Carbon\Carbon::parse($validated['end_time']);
      
      if ($endTime <= $now) {
        // Auction has already ended
        $status = 'ended';
      } elseif ($startTime <= $now) {
        // Auction has started but not ended
        $status = 'active';
      } else {
        // Auction hasn't started yet
        $status = 'pending';
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
    try {
      $auction = Auction::findOrFail($id);
      
      Log::info('Updating auction', [
        'auction_id' => $id,
        'request_all_keys' => array_keys($request->all()),
        'request_data' => $request->except(['images']), // Exclude images from log
        'request_method' => $request->method(),
        'content_type' => $request->header('Content-Type'),
        'has_files' => $request->hasFile('images'),
      ]);

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
      'end_time' => 'sometimes|date',
      'status' => 'sometimes|in:pending,active,ended,completed,cancelled',
      'images' => 'sometimes|array|max:4',
      'images.*' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:10240', // Max 10MB per image
    ]);

    // Validate end_time is after start_time (handle both cases: when both are updated, or only one)
    if (isset($validated['end_time'])) {
      $startTimeForValidation = isset($validated['start_time']) 
        ? \Carbon\Carbon::parse($validated['start_time'])
        : $auction->start_time;
      $endTime = \Carbon\Carbon::parse($validated['end_time']);
      
      if ($endTime <= $startTimeForValidation) {
        return response()->json([
          'error' => 'Validation failed',
          'message' => 'End time must be after start time.',
          'errors' => [
            'end_time' => ['End time must be after start time.'],
          ],
        ], 422);
      }
    }

    // Validate price relationships if prices are being updated
    if (isset($validated['starting_price']) || isset($validated['reserve_price']) || isset($validated['buy_now_price'])) {
      $startingPrice = isset($validated['starting_price']) ? (float) $validated['starting_price'] : (float) $auction->starting_price;
      $reservePrice = isset($validated['reserve_price']) ? ((float) $validated['reserve_price'] ?: null) : $auction->reserve_price;
      $buyNowPrice = isset($validated['buy_now_price']) ? ((float) $validated['buy_now_price'] ?: null) : $auction->buy_now_price;

      // Reserve price must be >= starting price
      if ($reservePrice !== null && $reservePrice < $startingPrice) {
        return response()->json([
          'error' => 'Validation failed',
          'message' => 'Reserve price must be greater than or equal to starting price.',
          'errors' => [
            'reserve_price' => ['Reserve price must be greater than or equal to starting price.'],
          ],
        ], 422);
      }

      // Buy now price must be >= starting price
      if ($buyNowPrice !== null && $buyNowPrice < $startingPrice) {
        return response()->json([
          'error' => 'Validation failed',
          'message' => 'Buy now price must be greater than or equal to starting price.',
          'errors' => [
            'buy_now_price' => ['Buy now price must be greater than or equal to starting price.'],
          ],
        ], 422);
      }

      // Buy now price must be >= reserve price (if both provided)
      if ($buyNowPrice !== null && $reservePrice !== null && $buyNowPrice < $reservePrice) {
        return response()->json([
          'error' => 'Validation failed',
          'message' => 'Buy now price must be greater than or equal to reserve price.',
          'errors' => [
            'buy_now_price' => ['Buy now price must be greater than or equal to reserve price.'],
          ],
        ], 422);
      }
    }

    // Recalculate status if start_time or end_time is being updated
    if (isset($validated['start_time']) || isset($validated['end_time'])) {
      $now = now();
      $startTime = isset($validated['start_time']) 
        ? \Carbon\Carbon::parse($validated['start_time']) 
        : $auction->start_time;
      $endTime = isset($validated['end_time']) 
        ? \Carbon\Carbon::parse($validated['end_time']) 
        : $auction->end_time;
      
      if ($endTime <= $now) {
        // Auction has already ended
        $validated['status'] = 'ended';
      } elseif ($startTime <= $now) {
        // Auction has started but not ended
        $validated['status'] = 'active';
      } else {
        // Auction hasn't started yet
        $validated['status'] = 'pending';
      }
    }

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
    
    Log::info('Auction updated successfully', [
      'auction_id' => $id,
      'updated_fields' => array_keys($validated),
    ]);

    // Format response to match index method format
    $now = now();
    $actualStatus = $auction->status;
    
    // Calculate actual status based on times
    if ($auction->status === 'completed') {
      $actualStatus = 'completed';
    } elseif ($auction->end_time <= $now) {
      $actualStatus = 'ended';
    } elseif ($auction->start_time <= $now && $auction->end_time > $now) {
      $actualStatus = 'active';
    } elseif ($auction->start_time > $now) {
      $actualStatus = 'pending';
    }

    $formattedAuction = [
      'id' => $auction->id,
      'slug' => $auction->slug,
      'title' => $auction->title,
      'description' => $auction->description,
      'user' => $auction->user ? [
        'id' => $auction->user->id,
        'name' => $auction->user->name,
      ] : null,
      'category_id' => $auction->category_id,
      'category' => $auction->category ? $auction->category->category : null,
      'location_id' => $auction->location_id,
      'reserve_price' => $auction->reserve_price ? (float) $auction->reserve_price : null,
      'buy_now_price' => $auction->buy_now_price ? (float) $auction->buy_now_price : null,
      'bid_increment' => (float) $auction->bid_increment,
      'starting_price' => (float) $auction->starting_price,
      'current_bid_price' => (float) ($auction->current_bid_price ?? $auction->starting_price),
      'bid_count' => $auction->getBidCount(),
      'status' => $actualStatus,
      'db_status' => $auction->status,
      'start_time' => $auction->start_time->toIso8601String(),
      'end_time' => $auction->end_time->toIso8601String(),
      'winner' => $auction->winner ? [
        'id' => $auction->winner->id,
        'name' => $auction->winner->name,
      ] : null,
      'views' => $auction->views ?? 0,
      'created_at' => $auction->created_at ? $auction->created_at->toIso8601String() : null,
    ];

    return response()->json($formattedAuction);
    } catch (\Illuminate\Validation\ValidationException $e) {
      Log::warning('Auction update validation failed', [
        'auction_id' => $id,
        'errors' => $e->errors(),
      ]);
      
      return response()->json([
        'error' => 'Validation failed',
        'message' => 'Please check your input and try again.',
        'errors' => $e->errors(),
      ], 422);
    } catch (\Exception $e) {
      Log::error('Failed to update auction', [
        'auction_id' => $id,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
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
      $result = $this->auctionService->endAuction((int) $id);
      
      if (!$result['success']) {
        return response()->json([
          'error' => $result['message'],
        ], 400);
      }

      // Use the auction from the result, or reload if not provided
      $auction = $result['auction'] ?? Auction::with(['user', 'currentBidder', 'category', 'location', 'winner'])->findOrFail($id);

      // Ensure status is 'ended' in the response
      $auction->status = 'ended';
      
      // Format the auction response similar to index method
      $formattedAuction = [
        'id' => $auction->id,
        'title' => $auction->title,
        'status' => 'ended', // Explicitly set to ended
        'user' => $auction->user ? [
          'id' => $auction->user->id,
          'name' => $auction->user->name,
        ] : null,
        'current_bid_price' => (float) ($auction->current_bid_price ?? $auction->starting_price),
        'bid_count' => $auction->getBidCount(),
        'end_time' => $auction->end_time->toIso8601String(),
        'winner' => $auction->winner ? [
          'id' => $auction->winner->id,
          'name' => $auction->winner->name,
        ] : null,
      ];

      return response()->json([
        'message' => $result['message'] ?? 'Auction ended successfully',
        'auction' => $formattedAuction,
        'winner' => $result['winner'] ?? null,
      ]);
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
      return response()->json([
        'error' => 'Auction not found',
        'message' => 'The auction you are trying to end does not exist.',
      ], 404);
    } catch (\Exception $e) {
      Log::error('Failed to end auction', [
        'auction_id' => $id,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
      ]);
      
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
      $usersToNotify = collect();

      // Strategy 1: Notify users who have bid on auctions in the same category
      if ($auction->category_id) {
        $categoryBidders = User::whereHas('bids', function($query) use ($auction) {
          $query->whereHas('auction', function($q) use ($auction) {
            $q->where('category_id', $auction->category_id)
              ->where('id', '!=', $auction->id); // Exclude this auction
          });
        })
        ->where('id', '!=', $auction->user_id)
        ->get();
        
        $usersToNotify = $usersToNotify->merge($categoryBidders);
      }

      // Strategy 2: Notify users with saved searches matching this auction
      $savedSearchUsers = User::whereHas('savedSearches', function($query) use ($auction) {
        $query->where('is_active', true)
          ->where(function($q) use ($auction) {
            // Category match: saved search category matches OR saved search has no category (matches all)
            $q->where(function($categoryQuery) use ($auction) {
              if ($auction->category_id) {
                $categoryQuery->where('category_id', $auction->category_id)
                  ->orWhereNull('category_id');
              } else {
                $categoryQuery->whereNull('category_id');
              }
            });
            
            // Location match: saved search location matches OR saved search has no location (matches all)
            if ($auction->location_id) {
              $q->where(function($locationQuery) use ($auction) {
                $locationQuery->where('location_id', $auction->location_id)
                  ->orWhereNull('location_id');
              });
            }
            
            // Price range match: starting price falls within saved search price range
            $q->where(function($priceQuery) use ($auction) {
              $priceQuery->where(function($p) use ($auction) {
                // No min_price OR starting_price >= min_price
                $p->whereNull('min_price')
                  ->orWhere('min_price', '<=', $auction->starting_price);
              })
              ->where(function($p) use ($auction) {
                // No max_price OR starting_price <= max_price
                $p->whereNull('max_price')
                  ->orWhere('max_price', '>=', $auction->starting_price);
              });
            });
            
            // Keyword match: if saved search has keywords, check if they appear in auction title
            if ($auction->title) {
              $q->orWhere(function($keywordQuery) use ($auction) {
                $keywordQuery->whereNotNull('search_query')
                  ->where('search_query', '!=', '')
                  ->where(function($kq) use ($auction) {
                    $titleWords = explode(' ', strtolower(trim($auction->title)));
                    foreach ($titleWords as $word) {
                      if (strlen($word) > 2) {
                        $kq->orWhere('search_query', 'like', "%{$word}%");
                      }
                    }
                  });
              });
            }
          });
      })
      ->where('id', '!=', $auction->user_id)
      ->get();
      
      $usersToNotify = $usersToNotify->merge($savedSearchUsers);

      // Remove duplicates and limit to prevent spam (max 100 users per auction)
      $usersToNotify = $usersToNotify->unique('id')->take(100);

      $notificationCount = 0;
      foreach ($usersToNotify as $user) {
        try {
          UserNotification::create([
            'user_id' => $user->id,
            'type' => 'new_auction',
            'title' => 'New Auction You Might Like',
            'message' => "A new auction has started: '{$auction->title}'. Starting price: Rs. " . number_format($auction->starting_price, 2),
            'metadata' => ['auction_id' => $auction->id],
            'link' => "/auctions/{$auction->id}",
            'is_read' => false,
          ]);
          $notificationCount++;
        } catch (\Exception $e) {
          Log::warning('Failed to create notification for user', [
            'user_id' => $user->id,
            'auction_id' => $auction->id,
            'error' => $e->getMessage()
          ]);
        }
      }
      
      Log::info('New auction notifications sent (targeted)', [
        'auction_id' => $auction->id,
        'auction_title' => $auction->title,
        'category_id' => $auction->category_id,
        'notifications_sent' => $notificationCount,
        'total_eligible_users' => $usersToNotify->count()
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to send new auction notifications', [
        'auction_id' => $auction->id,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
      ]);
    }
  }
}
