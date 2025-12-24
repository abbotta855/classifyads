<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Bid;
use App\Services\AuctionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AuctionController extends Controller
{
    protected AuctionService $auctionService;

    public function __construct(AuctionService $auctionService)
    {
        $this->auctionService = $auctionService;
    }

    /**
     * Display a listing of active auctions (public)
     */
    public function index(Request $request)
    {
        try {
            // Show auctions that are currently active or scheduled (based on actual times, not just status)
            // This ensures auctions show even if status hasn't been updated yet by scheduled commands
            $query = Auction::with(['category', 'location', 'user', 'currentBidder'])
                ->where('end_time', '>', now()) // Must not have ended yet
                ->where(function($q) {
                    // Active auctions: started but not ended (regardless of status field)
                    $q->where(function($subQ) {
                        $subQ->where('start_time', '<=', now())
                            ->where('end_time', '>', now())
                            ->whereIn('status', ['active', 'pending']); // Allow both statuses if times match
                    })
                    // Pending auctions: not started yet, not ended
                    ->orWhere(function($subQ) {
                        $subQ->where('start_time', '>', now())
                            ->where('end_time', '>', now())
                            ->where('status', 'pending');
                    });
                })
                ->orderBy('start_time', 'asc') // Show starting soon first
                ->orderBy('end_time', 'asc'); // Then ending soon

            // Search by title or description
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Filter by category
            if ($request->has('category_id')) {
                $query->byCategory($request->category_id);
            }

            // Filter by location
            if ($request->has('location_id')) {
                $query->byLocation($request->location_id);
            }

            // Filter by price range
            if ($request->has('min_price')) {
                $query->where('current_bid_price', '>=', $request->min_price);
            }
            if ($request->has('max_price')) {
                $query->where('current_bid_price', '<=', $request->max_price);
            }

            // Sorting
            $sortBy = $request->get('sort', 'ending_soon');
            switch ($sortBy) {
                case 'highest_bid':
                    $query->orderBy('current_bid_price', 'desc');
                    break;
                case 'newest':
                    $query->orderBy('created_at', 'desc');
                    break;
                case 'bid_count':
                    // This would require a join or subquery - simplified for now
                    $query->orderBy('created_at', 'desc');
                    break;
                case 'ending_soon':
                default:
                    $query->orderBy('end_time', 'asc');
                    break;
            }

            $auctions = $query->paginate(40);

            // Transform data (reuse ad pattern)
            $transformedAuctions = $auctions->getCollection()->map(function ($auction) {
                // Build location string
                $locationString = null;
                if ($auction->location) {
                    $parts = [];
                    if ($auction->location->province) $parts[] = $auction->location->province;
                    if ($auction->location->district) $parts[] = $auction->location->district;
                    if ($auction->location->local_level) $parts[] = $auction->location->local_level;
                    if ($auction->location->ward_number) $parts[] = 'Ward ' . $auction->location->ward_number;
                    if ($auction->location->local_address) {
                        $addresses = explode(', ', $auction->location->local_address);
                        if (!empty($addresses[0])) {
                            $parts[] = $addresses[0];
                        }
                    }
                    $locationString = implode(' > ', $parts);
                }

                // Get primary image
                $image = $auction->image1_url 
                    ?? $auction->image2_url 
                    ?? $auction->image3_url 
                    ?? $auction->image4_url
                    ?? ($auction->ad ? ($auction->ad->image1_url ?? 'https://via.placeholder.com/1200x1200?text=No+Image') : 'https://via.placeholder.com/1200x1200?text=No+Image');

                // Get category name
                $categoryName = $auction->category ? $auction->category->category : 'Uncategorized';
                $subcategoryName = $auction->category && $auction->category->sub_category 
                    ? $auction->category->sub_category 
                    : null;

                // Calculate actual status based on times (not just database status)
                // This ensures users see correct status even if scheduled commands haven't run
                $actualStatus = $auction->status;
                if ($auction->end_time <= now()) {
                    $actualStatus = 'ended';
                } elseif ($auction->start_time <= now() && $auction->end_time > now()) {
                    $actualStatus = 'active';
                } elseif ($auction->start_time > now()) {
                    $actualStatus = 'pending';
                }

                return [
                    'id' => $auction->id,
                    'slug' => $auction->slug,
                    'title' => $auction->title,
                    'description' => $auction->description,
                    'current_bid' => (float) ($auction->current_bid_price ?? $auction->starting_price),
                    'starting_price' => (float) $auction->starting_price,
                    'buy_now_price' => $auction->buy_now_price ? (float) $auction->buy_now_price : null,
                    'image' => $image,
                    'category' => $categoryName,
                    'subcategory' => $subcategoryName,
                    'category_id' => $auction->category_id,
                    'location' => $locationString,
                    'location_id' => $auction->location_id,
                    'user_id' => $auction->user_id,
                    'bid_count' => $auction->getBidCount(),
                    'time_remaining' => $auction->getTimeRemaining(),
                    'status' => $actualStatus, // Include calculated status
                    'is_active' => $actualStatus === 'active', // Helper for frontend
                    'end_time' => $auction->end_time->toIso8601String(),
                    'start_time' => $auction->start_time->toIso8601String(),
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
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'auctions' => [],
                'total' => 0,
            ], 500);
        }
    }

    /**
     * Display a single auction (public)
     */
    public function show($id)
    {
        try {
            // Support both ID and slug (like ads)
            $auction = Auction::with(['category', 'location', 'user', 'currentBidder', 'bids.user'])
                ->where(function ($query) use ($id) {
                    if (is_numeric($id)) {
                        $query->where('id', $id);
                    } else {
                        $query->where('slug', $id);
                    }
                })
                ->firstOrFail();

            // Build location string
            $locationString = null;
            if ($auction->location) {
                $parts = [];
                if ($auction->location->province) $parts[] = $auction->location->province;
                if ($auction->location->district) $parts[] = $auction->location->district;
                if ($auction->location->local_level) $parts[] = $auction->location->local_level;
                if ($auction->location->ward_number) $parts[] = 'Ward ' . $auction->location->ward_number;
                if ($auction->location->local_address) {
                    $addresses = explode(', ', $auction->location->local_address);
                    if (!empty($addresses[0])) {
                        $parts[] = $addresses[0];
                    }
                }
                $locationString = implode(' > ', $parts);
            }

            // Get all images
            $images = [];
            if ($auction->image1_url) $images[] = $auction->image1_url;
            if ($auction->image2_url) $images[] = $auction->image2_url;
            if ($auction->image3_url) $images[] = $auction->image3_url;
            if ($auction->image4_url) $images[] = $auction->image4_url;
            
            // Fallback to ad images if no auction images
            if (empty($images) && $auction->ad) {
                if ($auction->ad->image1_url) $images[] = $auction->ad->image1_url;
                if ($auction->ad->image2_url) $images[] = $auction->ad->image2_url;
                if ($auction->ad->image3_url) $images[] = $auction->ad->image3_url;
                if ($auction->ad->image4_url) $images[] = $auction->ad->image4_url;
            }
            
            if (empty($images)) {
                $images[] = 'https://via.placeholder.com/1200x1200?text=No+Image';
            }

            // Get category info
            $categoryName = $auction->category ? $auction->category->category : 'Uncategorized';
            $subcategoryName = $auction->category && $auction->category->sub_category 
                ? $auction->category->sub_category 
                : null;

            // Get seller info
            $seller = null;
            if ($auction->user) {
                $seller = [
                    'id' => $auction->user->id,
                    'name' => $auction->user->name,
                    'profile_picture' => $auction->user->profile_picture,
                ];
            }

            // Get user's bid status (if logged in)
            $userBidStatus = null;
            if (Auth::check()) {
                $userBid = $auction->bids()
                    ->where('user_id', Auth::id())
                    ->orderBy('bid_amount', 'desc')
                    ->first();
                
                if ($userBid) {
                    $userBidStatus = [
                        'has_bid' => true,
                        'is_winning' => $userBid->is_winning_bid,
                        'bid_amount' => (float) $userBid->bid_amount,
                        'outbid' => !$userBid->is_winning_bid,
                    ];
                } else {
                    $userBidStatus = ['has_bid' => false];
                }
            }

            // Get bid history (last 20)
            $bidHistory = $auction->bids()
                ->with('user:id,name,profile_picture')
                ->orderBy('bid_amount', 'desc')
                ->limit(20)
                ->get()
                ->map(function ($bid) {
                    return [
                        'id' => $bid->id,
                        'user' => [
                            'id' => $bid->user->id,
                            'name' => $bid->user->name,
                            'profile_picture' => $bid->user->profile_picture,
                        ],
                        'bid_amount' => (float) $bid->bid_amount,
                        'is_winning' => $bid->is_winning_bid,
                        'created_at' => $bid->created_at->toIso8601String(),
                    ];
                });

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
            
            // Calculate is_active based on actual status
            $isActive = ($actualStatus === 'active');

            return response()->json([
                'id' => $auction->id,
                'slug' => $auction->slug,
                'title' => $auction->title,
                'description' => $auction->description,
                'images' => $images,
                'image' => $images[0],
                'category' => $categoryName,
                'subcategory' => $subcategoryName,
                'location' => $locationString,
                'location_id' => $auction->location_id,
                'starting_price' => (float) $auction->starting_price,
                'current_bid' => (float) ($auction->current_bid_price ?? $auction->starting_price),
                'reserve_price' => $auction->reserve_price ? (float) $auction->reserve_price : null,
                'buy_now_price' => $auction->buy_now_price ? (float) $auction->buy_now_price : null,
                'bid_increment' => (float) $auction->bid_increment,
                'next_minimum_bid' => (float) $auction->getNextMinimumBid(),
                'bid_count' => $auction->getBidCount(),
                'time_remaining' => $auction->getTimeRemaining(),
                'start_time' => $auction->start_time->toIso8601String(),
                'end_time' => $auction->end_time->toIso8601String(),
                'status' => $actualStatus, // Use calculated status
                'is_active' => $isActive, // Use calculated is_active
                'user_id' => $auction->user_id,
                'seller' => $seller,
                'current_bidder' => $auction->currentBidder ? [
                    'id' => $auction->currentBidder->id,
                    'name' => $auction->currentBidder->name,
                ] : null,
                'user_bid_status' => $userBidStatus,
                'bid_history' => $bidHistory,
                'views' => $auction->views ?? 0,
                'created_at' => $auction->created_at ? $auction->created_at->toIso8601String() : null,
                'updated_at' => $auction->updated_at->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Auction not found',
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Place a bid on an auction
     */
    public function placeBid(Request $request, $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        try {
            // Support both ID and slug
            $auction = Auction::where(function ($query) use ($id) {
                if (is_numeric($id)) {
                    $query->where('id', $id);
                } else {
                    $query->where('slug', $id);
                }
            })->firstOrFail();

            $result = $this->auctionService->placeBid(
                $auction->id,
                Auth::id(),
                $request->amount
            );

            if (!$result['valid']) {
                return response()->json([
                    'error' => $result['message'],
                    'minimum_bid' => $result['minimum_bid'] ?? null,
                ], 400);
            }

            // Format auction response to include bid_count
            $auction = $result['auction'];
            
            // Clear any relationship cache and force fresh query
            $auction->unsetRelation('bids');
            
            // Reload bids relationship with fresh query
            $auction->load('bids');
            
            // Calculate bid_count using direct DB query to avoid any caching issues
            // Use DB::table to ensure we get the most up-to-date count
            $bidCount = DB::table('bids')
                ->where('auction_id', $auction->id)
                ->count();
            
            Log::info('Bid count calculation in placeBid response', [
                'auction_id' => $auction->id,
                'bid_count_from_relationship' => $auction->bids()->count(),
                'bid_count_from_direct_query' => $bidCount,
                'bids_collection_count' => $auction->bids->count(),
                'bids_loaded' => $auction->relationLoaded('bids'),
            ]);
            
            // Convert to array and ensure bid_count is set
            $auctionArray = $auction->toArray();
            
            // Force set bid_count - don't rely on toArray() preserving it
            $auctionArray['bid_count'] = (int) $bidCount;
            
            Log::info('Final auction array for response', [
                'auction_id' => $auction->id,
                'bid_count_in_array' => $auctionArray['bid_count'] ?? 'NOT SET',
                'has_bid_count_key' => isset($auctionArray['bid_count']),
            ]);
            $auctionArray['current_bid'] = (float) ($auction->current_bid_price ?? $auction->starting_price);
            $auctionArray['current_bid_price'] = (float) ($auction->current_bid_price ?? $auction->starting_price);
            $auctionArray['next_minimum_bid'] = (float) $auction->getNextMinimumBid();
            
            return response()->json([
                'message' => $result['message'],
                'bid' => $result['bid'],
                'auction' => $auctionArray,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to place bid',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Buy Now - Purchase auction immediately
     */
    public function buyNow(Request $request, $id)
    {
        try {
            // Support both ID and slug
            $auction = Auction::where(function ($query) use ($id) {
                if (is_numeric($id)) {
                    $query->where('id', $id);
                } else {
                    $query->where('slug', $id);
                }
            })->firstOrFail();

            $result = $this->auctionService->buyNow(
                $auction->id,
                Auth::id()
            );

            if (!$result['success']) {
                return response()->json([
                    'error' => $result['message'],
                ], 400);
            }

            return response()->json([
                'message' => $result['message'],
                'auction' => $result['auction'],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to process Buy Now',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get bid history for an auction
     */
    public function getBidHistory($id)
    {
        try {
            $auction = Auction::where(function ($query) use ($id) {
                if (is_numeric($id)) {
                    $query->where('id', $id);
                } else {
                    $query->where('slug', $id);
                }
            })->firstOrFail();

            $bids = $auction->bids()
                ->with('user:id,name,profile_picture')
                ->orderBy('bid_amount', 'desc')
                ->paginate(20);

            $transformedBids = $bids->getCollection()->map(function ($bid) {
                return [
                    'id' => $bid->id,
                    'user' => [
                        'id' => $bid->user->id,
                        'name' => $bid->user->name,
                        'profile_picture' => $bid->user->profile_picture,
                    ],
                    'bid_amount' => (float) $bid->bid_amount,
                    'is_winning' => $bid->is_winning_bid,
                    'created_at' => $bid->created_at->toIso8601String(),
                ];
            });

            return response()->json([
                'bids' => $transformedBids,
                'current_page' => $bids->currentPage(),
                'last_page' => $bids->lastPage(),
                'per_page' => $bids->perPage(),
                'total' => $bids->total(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch bid history',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Track a click on an auction
     */
    public function trackClick(Request $request, $id)
    {
        try {
            $auction = Auction::where(function ($query) use ($id) {
                if (is_numeric($id)) {
                    $query->where('id', $id);
                } else {
                    $query->where('slug', $id);
                }
            })->firstOrFail();

            // Track click (similar to ad clicks)
            // You can create an AuctionClick model if needed, or just increment views
            $auction->incrementView();

            return response()->json([
                'message' => 'Click tracked',
                'auction_id' => $auction->id,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to track click',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get status updates for specific auctions (public endpoint)
     * Used for real-time status polling on user pages
     */
    public function statuses(Request $request)
    {
        $query = Auction::select('id', 'start_time', 'end_time', 'status');
        
        if ($request->has('ids')) {
            $ids = is_array($request->ids) ? $request->ids : explode(',', $request->ids);
            $query->whereIn('id', $ids);
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

        $activeAuctions = $result->filter(fn($a) => in_array($a['status'], ['pending', 'active']));
        $recommendedInterval = 10;
        
        if ($activeAuctions->isNotEmpty()) {
            $closestChange = $activeAuctions->min('seconds_until_change');
            if ($closestChange !== null) {
                if ($closestChange <= 60) {
                    $recommendedInterval = 1;
                } elseif ($closestChange <= 300) {
                    $recommendedInterval = 5;
                } else {
                    $recommendedInterval = 10;
                }
            }
        }
        
        return response()->json([
            'statuses' => $result->pluck('status', 'id'),
            'recommended_interval' => $recommendedInterval,
            'details' => $result->keyBy('id'),
        ]);
    }
}
