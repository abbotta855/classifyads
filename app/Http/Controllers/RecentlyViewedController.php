<?php

namespace App\Http\Controllers;

use App\Models\RecentlyViewed;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RecentlyViewedController extends Controller
{
    /**
     * Get recently viewed items for the authenticated user
     */
    public function index(Request $request)
    {
        $recentlyViewed = RecentlyViewed::where('user_id', $request->user()->id)
            ->with(['ad.user', 'ad.category', 'ad.photos'])
            ->orderBy('viewed_at', 'desc')
            ->limit(50) // Limit to 50 most recent
            ->get();

        return response()->json($recentlyViewed);
    }

    /**
     * Track a view (create or update)
     */
    public function track(Request $request)
    {
        $request->validate([
            'ad_id' => 'required|exists:ads,id',
        ]);

        $user = $request->user();
        $adId = $request->ad_id;

        // Update or create - if exists, update viewed_at, otherwise create new
        $recentlyViewed = RecentlyViewed::updateOrCreate(
            [
                'user_id' => $user->id,
                'ad_id' => $adId,
            ],
            [
                'viewed_at' => Carbon::now(),
            ]
        );

        // Keep only last 50 items per user (cleanup old ones)
        $this->cleanupOldViews($user->id);

        return response()->json([
            'message' => 'View tracked',
            'recently_viewed' => $recentlyViewed,
        ], 200);
    }

    /**
     * Clear all recently viewed items
     */
    public function clear(Request $request)
    {
        RecentlyViewed::where('user_id', $request->user()->id)->delete();

        return response()->json([
            'message' => 'Recently viewed items cleared',
        ], 200);
    }

    /**
     * Remove a specific item
     */
    public function destroy(Request $request, $id)
    {
        $recentlyViewed = RecentlyViewed::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $recentlyViewed->delete();

        return response()->json([
            'message' => 'Item removed from recently viewed',
        ], 200);
    }

    /**
     * Cleanup old views - keep only 50 most recent per user
     */
    private function cleanupOldViews($userId)
    {
        $count = RecentlyViewed::where('user_id', $userId)->count();
        
        if ($count > 50) {
            $toDelete = RecentlyViewed::where('user_id', $userId)
                ->orderBy('viewed_at', 'asc')
                ->limit($count - 50)
                ->pluck('id');
            
            RecentlyViewed::whereIn('id', $toDelete)->delete();
        }
    }
}

