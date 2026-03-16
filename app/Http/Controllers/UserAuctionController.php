<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Bid;
use App\Services\AuctionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class UserAuctionController extends Controller
{
    protected AuctionService $auctionService;

    public function __construct(AuctionService $auctionService)
    {
        $this->auctionService = $auctionService;
    }
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

                // Calculate actual status based on times (not just database status)
                // This ensures users see correct status even if scheduled commands haven't run
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
                    'category' => $auction->category ? $auction->category->category : null,
                    'location' => $auction->location ? $auction->location->name : null,
                    'starting_price' => (float) $auction->starting_price,
                    'current_bid_price' => (float) ($auction->current_bid_price ?? $auction->starting_price),
                    'bid_count' => $auction->getBidCount(),
                    'status' => $actualStatus, // Use calculated status instead of database status
                    'is_active' => $actualStatus === 'active',
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

    /**
     * Create a new auction (user can only create for themselves)
     * Only verified sellers can create auctions
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Check if user is a verified seller
        if (!$user->seller_verified) {
            return response()->json([
                'error' => 'Seller verification required',
                'message' => 'You must be a verified seller to create auctions. Please complete seller verification first.',
                'requires_verification' => true,
            ], 403);
        }

        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'location_id' => 'nullable|exists:locations,id',
            'title' => 'required|string|max:90',
            'description' => ['required', 'string', function ($attribute, $value, $fail) {
                $wordCount = str_word_count(strip_tags($value));
                if ($wordCount > 300) {
                    $fail('The description must not exceed 300 words. Current: ' . $wordCount . ' words.');
                }
            }],
            'starting_price' => 'required|numeric|min:0',
            'reserve_price' => 'nullable|numeric|min:0',
            'buy_now_price' => 'nullable|numeric|min:0',
            'bid_increment' => 'nullable|numeric|min:0.01',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'images' => 'nullable|array|max:4',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240',
            'self_pickup' => 'nullable|boolean',
            'seller_delivery' => 'nullable|boolean',
            'payment_methods' => 'nullable|json',
            'financing_available' => 'nullable|boolean',
            'financing_terms' => 'nullable|json',
        ]);

        // Validate price relationships
        $startingPrice = (float) $validated['starting_price'];
        $reservePrice = isset($validated['reserve_price']) ? (float) $validated['reserve_price'] : null;
        $buyNowPrice = isset($validated['buy_now_price']) ? (float) $validated['buy_now_price'] : null;

        if ($reservePrice !== null && $reservePrice < $startingPrice) {
            return response()->json([
                'error' => 'Validation failed',
                'message' => 'Reserve price must be greater than or equal to starting price.',
            ], 422);
        }

        if ($buyNowPrice !== null && $buyNowPrice < $startingPrice) {
            return response()->json([
                'error' => 'Validation failed',
                'message' => 'Buy now price must be greater than or equal to starting price.',
            ], 422);
        }

        if ($buyNowPrice !== null && $reservePrice !== null && $buyNowPrice < $reservePrice) {
            return response()->json([
                'error' => 'Validation failed',
                'message' => 'Buy now price must be greater than or equal to reserve price.',
            ], 422);
        }

        try {
            // Handle image uploads
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

            // Generate slug
            $slug = Auction::generateSlug($validated['title']);

            // Determine initial status
            $now = now();
            $startTime = \Carbon\Carbon::parse($validated['start_time']);
            $endTime = \Carbon\Carbon::parse($validated['end_time']);
            
            if ($endTime <= $now) {
                $status = 'ended';
            } elseif ($startTime <= $now) {
                $status = 'active';
            } else {
                $status = 'pending';
            }

            // Parse JSON fields
            $paymentMethods = null;
            if (isset($validated['payment_methods'])) {
                $paymentMethods = is_string($validated['payment_methods']) 
                    ? json_decode($validated['payment_methods'], true) 
                    : $validated['payment_methods'];
            }
            
            $financingTerms = null;
            if (isset($validated['financing_terms'])) {
                $financingTerms = is_string($validated['financing_terms']) 
                    ? json_decode($validated['financing_terms'], true) 
                    : $validated['financing_terms'];
            }

            // Create auction (user_id is automatically set to authenticated user)
            $auction = Auction::create([
                'user_id' => Auth::id(),
                'category_id' => $validated['category_id'],
                'location_id' => $validated['location_id'] ?? null,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'slug' => $slug,
                'starting_price' => $validated['starting_price'],
                'reserve_price' => $validated['reserve_price'] ?? null,
                'buy_now_price' => $validated['buy_now_price'] ?? null,
                'self_pickup' => $validated['self_pickup'] ?? false,
                'seller_delivery' => $validated['seller_delivery'] ?? false,
                'payment_methods' => $paymentMethods,
                'financing_available' => $validated['financing_available'] ?? false,
                'financing_terms' => $financingTerms,
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

            return response()->json($auction, 201);
        } catch (\Exception $e) {
            Log::error('Failed to create auction', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);
            
            return response()->json([
                'error' => 'Failed to create auction',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an auction (user can only update their own auctions)
     */
    public function update(Request $request, string $id)
    {
        try {
            $auction = Auction::findOrFail($id);

            // Ensure user owns this auction
            if ($auction->user_id !== Auth::id()) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'You can only edit your own auctions.',
                ], 403);
            }

            // Restrict editing based on status
            if ($auction->status !== 'pending') {
                return response()->json([
                    'error' => 'Validation failed',
                    'message' => 'Auction can only be edited when status is pending. Current status: ' . $auction->status,
                ], 422);
            }

            $validated = $request->validate([
                'category_id' => 'sometimes|exists:categories,id',
                'location_id' => 'sometimes|nullable|exists:locations,id',
                'title' => 'sometimes|string|max:90',
                'description' => ['sometimes', 'string', function ($attribute, $value, $fail) {
                    if ($value) {
                        $wordCount = str_word_count(strip_tags($value));
                        if ($wordCount > 300) {
                            $fail('The description must not exceed 300 words. Current: ' . $wordCount . ' words.');
                        }
                    }
                }],
                'starting_price' => 'sometimes|numeric|min:0',
                'reserve_price' => 'sometimes|nullable|numeric|min:0',
                'buy_now_price' => 'sometimes|nullable|numeric|min:0',
                'bid_increment' => 'sometimes|numeric|min:0.01',
                'start_time' => 'sometimes|date',
                'end_time' => 'sometimes|date|after:start_time',
                'images' => 'sometimes|array|max:4',
                'images.*' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:10240',
                'self_pickup' => 'sometimes|boolean',
                'seller_delivery' => 'sometimes|boolean',
                'payment_methods' => 'sometimes|nullable|json',
                'financing_available' => 'sometimes|boolean',
                'financing_terms' => 'sometimes|nullable|json',
            ]);

            // Handle image uploads
            if ($request->hasFile('images')) {
                $images = $request->file('images');
                
                foreach ($images as $index => $image) {
                    if ($image && $image->isValid() && $index < 4) {
                        // Delete old image if exists
                        $oldImageField = 'image' . ($index + 1) . '_url';
                        if ($auction->$oldImageField) {
                            $oldPath = str_replace('/storage/', '', $auction->$oldImageField);
                            Storage::disk('public')->delete($oldPath);
                        }
                        
                        $path = $image->store('auctions/photos', 'public');
                        $validated['image' . ($index + 1) . '_url'] = Storage::url($path);
                    }
                }
            }

            // Update slug if title changed
            if (isset($validated['title']) && $validated['title'] !== $auction->title) {
                $validated['slug'] = Auction::generateSlug($validated['title'], $auction->id);
            }

            // Parse JSON fields
            if (isset($validated['payment_methods'])) {
                $validated['payment_methods'] = is_string($validated['payment_methods']) 
                    ? json_decode($validated['payment_methods'], true) 
                    : $validated['payment_methods'];
            }
            
            if (isset($validated['financing_terms'])) {
                $validated['financing_terms'] = is_string($validated['financing_terms']) 
                    ? json_decode($validated['financing_terms'], true) 
                    : $validated['financing_terms'];
            }

            $auction->update($validated);
            $auction->load(['user', 'category', 'location']);

            return response()->json($auction);
        } catch (\Exception $e) {
            Log::error('Failed to update auction', [
                'auction_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Failed to update auction',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an auction (user can only delete their own auctions)
     */
    public function destroy(string $id)
    {
        try {
            $auction = Auction::findOrFail($id);

            // Ensure user owns this auction
            if ($auction->user_id !== Auth::id()) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'You can only delete your own auctions.',
                ], 403);
            }

            // Prevent deletion if auction has bids
            if ($auction->bids()->exists()) {
                return response()->json([
                    'error' => 'Cannot delete auction',
                    'message' => 'Cannot delete auction that has received bids.',
                ], 422);
            }

            // Delete images
            foreach (['image1_url', 'image2_url', 'image3_url', 'image4_url'] as $imageField) {
                if ($auction->$imageField) {
                    $path = str_replace('/storage/', '', $auction->$imageField);
                    Storage::disk('public')->delete($path);
                }
            }

            $auction->delete();

            return response()->json(['message' => 'Auction deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to delete auction', [
                'auction_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Failed to delete auction',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * End an auction manually (user can only end their own auctions)
     */
    public function endAuction(string $id)
    {
        try {
            $auction = Auction::findOrFail($id);

            // Ensure user owns this auction
            if ($auction->user_id !== Auth::id()) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'You can only end your own auctions.',
                ], 403);
            }

            // Use AuctionService to end auction (handles winner determination)
            $result = $this->auctionService->endAuction($auction->id);

            if ($result['success']) {
                return response()->json($result);
            } else {
                return response()->json([
                    'error' => 'Failed to end auction',
                    'message' => $result['message'] ?? 'Unknown error',
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Failed to end auction', [
                'auction_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Failed to end auction',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get bid history for a specific auction (user can only view their own auctions)
     */
    public function getBidHistory(string $id)
    {
        try {
            $auction = Auction::findOrFail($id);

            // Ensure user owns this auction
            if ($auction->user_id !== Auth::id()) {
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'You can only view bid history for your own auctions.',
                ], 403);
            }

            $bids = Bid::with(['user'])
                ->where('auction_id', $id)
                ->orderBy('bid_amount', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($bid) {
                    return [
                        'id' => $bid->id,
                        'user_id' => $bid->user_id,
                        'user_name' => $bid->user->name ?? 'Unknown',
                        'bid_amount' => (float) $bid->bid_amount,
                        'is_winning_bid' => $bid->is_winning_bid,
                        'is_proxy_bid' => $bid->is_proxy_bid ?? false,
                        'max_bid_amount' => $bid->max_bid_amount ? (float) $bid->max_bid_amount : null,
                        'created_at' => $bid->created_at->toIso8601String(),
                        'outbid_at' => $bid->outbid_at ? $bid->outbid_at->toIso8601String() : null,
                    ];
                });

            return response()->json([
                'auction_id' => $id,
                'bids' => $bids,
                'total_bids' => $bids->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get bid history', [
                'auction_id' => $id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Failed to get bid history',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
