<?php

namespace App\Http\Controllers;

use App\Models\Watchlist;
use Illuminate\Http\Request;

class WatchlistController extends Controller
{
    /**
     * Get all watchlist items for the authenticated user
     */
    public function index(Request $request)
    {
        $watchlists = Watchlist::where('user_id', $request->user()->id)
            ->with(['ad.user', 'ad.category', 'ad.photos'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($watchlists);
    }

    /**
     * Add an ad to watchlist
     */
    public function store(Request $request)
    {
        $request->validate([
            'ad_id' => 'required|exists:ads,id',
        ]);

        $user = $request->user();
        $adId = $request->ad_id;

        // Check if already in watchlist
        $existing = Watchlist::where('user_id', $user->id)
            ->where('ad_id', $adId)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Ad is already in your watchlist',
                'watchlist' => $existing,
            ], 200);
        }

        $watchlist = Watchlist::create([
            'user_id' => $user->id,
            'ad_id' => $adId,
        ]);

        $watchlist->load(['ad.user', 'ad.category', 'ad.photos']);

        return response()->json([
            'message' => 'Ad added to watchlist',
            'watchlist' => $watchlist,
        ], 201);
    }

    /**
     * Remove an ad from watchlist
     */
    public function destroy(Request $request, $id)
    {
        $watchlist = Watchlist::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $watchlist->delete();

        return response()->json([
            'message' => 'Ad removed from watchlist',
        ], 200);
    }

    /**
     * Remove by ad_id (convenience method)
     */
    public function removeByAd(Request $request, $adId)
    {
        $watchlist = Watchlist::where('user_id', $request->user()->id)
            ->where('ad_id', $adId)
            ->first();

        if ($watchlist) {
            $watchlist->delete();
            return response()->json([
                'message' => 'Ad removed from watchlist',
            ], 200);
        }

        return response()->json([
            'message' => 'Ad not found in watchlist',
        ], 404);
    }

    /**
     * Check if an ad is in watchlist
     */
    public function check(Request $request, $adId)
    {
        $isWatched = Watchlist::where('user_id', $request->user()->id)
            ->where('ad_id', $adId)
            ->exists();

        return response()->json([
            'is_watched' => $isWatched,
        ]);
    }
}
