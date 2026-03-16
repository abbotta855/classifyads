<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use App\Models\Favourite;
use App\Models\Watchlist;
use App\Models\RecentlyViewed;
use App\Models\SavedSearch;
use App\Models\Transaction;
use App\Models\LiveChat;
use App\Models\Offer;
use App\Models\AdClick;
use App\Models\BuyerSellerMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ItemsSellingController extends Controller
{
    /**
     * Get detailed metrics for all items being sold by the authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get all ads by this user with related data
        $ads = Ad::where('user_id', $user->id)
            ->with(['category', 'location', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();

        $itemsSelling = $ads->map(function ($ad) use ($user) {
            // Count metrics
            $views = $ad->views ?? 0;
            $clicks = AdClick::where('ad_id', $ad->id)->count();
            $watchlistCount = Watchlist::where('ad_id', $ad->id)->count();
            $favouriteCount = Favourite::where('ad_id', $ad->id)->count();
            $savedSearchCount = SavedSearch::where('search_query', 'like', '%' . $ad->title . '%')
                ->orWhere('search_query', 'like', '%' . ($ad->category->category ?? '') . '%')
                ->count();
            
            // Count inquiries (buyer messages about this ad)
            $inquiriesCount = BuyerSellerMessage::where('ad_id', $ad->id)
                ->where('seller_id', $user->id)
                ->where('sender_type', 'buyer')
                ->distinct('buyer_id')
                ->count('buyer_id');
            
            // Get offers for this ad
            $offers = Offer::where('vendor_id', $user->id)
                ->where('ad_id', $ad->id)
                ->orderBy('created_at', 'desc')
                ->get();
            
            // Get buyers (transactions where this ad was purchased)
            $buyers = Transaction::where('related_ad_id', $ad->id)
                ->where('type', 'purchase')
                ->where('status', 'completed')
                ->with('user')
                ->get()
                ->map(function ($transaction) {
                    return [
                        'user_id' => $transaction->user_id,
                        'user_name' => $transaction->user->name ?? 'Unknown',
                        'purchase_date' => $transaction->created_at->toIso8601String(),
                        'price' => (float) $transaction->amount,
                    ];
                });

            // Calculate total earning from this ad
            $totalEarning = Transaction::where('related_ad_id', $ad->id)
                ->where('type', 'purchase')
                ->where('status', 'completed')
                ->sum('amount') ?? 0;

            return [
                'id' => $ad->id,
                'item_name' => $ad->title,
                'listed_date' => $ad->created_at->toIso8601String(),
                'price_per_unit' => (float) $ad->price,
                'views' => $views,
                'clicks' => $clicks,
                'watchlist_count' => $watchlistCount,
                'favourite_count' => $favouriteCount,
                'saved_search_count' => $savedSearchCount,
                'inquiries_count' => $inquiriesCount,
                'sold' => $ad->status === 'sold',
                'offers' => $offers->map(function ($offer) {
                    return [
                        'id' => $offer->id,
                        'offer_percentage' => (float) $offer->offer_percentage,
                        'status' => $offer->status,
                        'valid_until' => $offer->valid_until->toIso8601String(),
                        'created_date' => $offer->created_date->toIso8601String(),
                    ];
                }),
                'total_earning' => (float) $totalEarning,
                'buyers' => $buyers,
                'category' => $ad->category ? [
                    'id' => $ad->category->id,
                    'category' => $ad->category->category,
                    'sub_category' => $ad->category->sub_category,
                ] : null,
                'location' => $ad->location ? $ad->location->name : null,
                'image_url' => $ad->image1_url,
                'status' => $ad->status,
            ];
        });

        // Calculate summary statistics
        $summary = [
            'total_items' => $itemsSelling->count(),
            'active_items' => $itemsSelling->where('sold', false)->count(),
            'sold_items' => $itemsSelling->where('sold', true)->count(),
            'total_views' => $itemsSelling->sum('views'),
            'total_clicks' => $itemsSelling->sum('clicks'),
            'total_earning' => $itemsSelling->sum('total_earning'),
            'total_inquiries' => $itemsSelling->sum('inquiries_count'),
        ];

        return response()->json([
            'items' => $itemsSelling,
            'summary' => $summary,
        ]);
    }

    /**
     * Get detailed metrics for a specific item
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        $ad = Ad::where('user_id', $user->id)
            ->with(['category', 'location', 'user'])
            ->findOrFail($id);

        // Get all the same metrics as index but for single ad
        $views = $ad->views ?? 0;
        $clicks = AdClick::where('ad_id', $ad->id)->count();
        $watchlistCount = Watchlist::where('ad_id', $ad->id)->count();
        $favouriteCount = Favourite::where('ad_id', $ad->id)->count();
        $savedSearchCount = SavedSearch::where('search_query', 'like', '%' . $ad->title . '%')
            ->orWhere('search_query', 'like', '%' . ($ad->category->category ?? '') . '%')
            ->count();
        
        $inquiriesCount = BuyerSellerMessage::where('ad_id', $ad->id)
            ->where('seller_id', $user->id)
            ->where('sender_type', 'buyer')
            ->distinct('buyer_id')
            ->count('buyer_id');
        
        $offers = Offer::where('vendor_id', $user->id)
            ->where('ad_id', $ad->id)
            ->get();
        
        $buyers = Transaction::where('related_ad_id', $ad->id)
            ->where('type', 'purchase')
            ->where('status', 'completed')
            ->with('user')
            ->get()
            ->map(function ($transaction) {
                return [
                    'user_id' => $transaction->user_id,
                    'user_name' => $transaction->user->name ?? 'Unknown',
                    'purchase_date' => $transaction->created_at->toIso8601String(),
                    'price' => (float) $transaction->amount,
                    'quantity' => 1, // Default to 1, can be enhanced later
                ];
            });

        $totalEarning = Transaction::where('related_ad_id', $ad->id)
            ->where('type', 'purchase')
            ->where('status', 'completed')
            ->sum('amount') ?? 0;

        return response()->json([
            'id' => $ad->id,
            'item_name' => $ad->title,
            'description' => $ad->description,
            'listed_date' => $ad->created_at->toIso8601String(),
            'posted_date' => $ad->created_at->toIso8601String(),
            'price_per_unit' => (float) $ad->price,
            'views' => $views,
            'clicks' => $clicks,
            'watchlist_count' => $watchlistCount,
            'favourite_count' => $favouriteCount,
            'saved_search_count' => $savedSearchCount,
            'inquiries_count' => $inquiriesCount,
            'sold' => $ad->status === 'sold',
            'offers' => $offers->map(function ($offer) {
                return [
                    'id' => $offer->id,
                    'offer_percentage' => (float) $offer->offer_percentage,
                    'status' => $offer->status,
                    'valid_until' => $offer->valid_until->toIso8601String(),
                    'created_date' => $offer->created_date->toIso8601String(),
                ];
            }),
            'total_earning' => (float) $totalEarning,
            'buyers' => $buyers,
            'category' => $ad->category ? [
                'id' => $ad->category->id,
                'category' => $ad->category->category,
                'sub_category' => $ad->category->sub_category,
            ] : null,
            'location' => $ad->location ? $ad->location->name : null,
            'images' => [
                $ad->image1_url,
                $ad->image2_url,
                $ad->image3_url,
                $ad->image4_url,
            ]->filter(),
        ]);
    }

}

