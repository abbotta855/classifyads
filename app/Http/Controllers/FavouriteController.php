<?php

namespace App\Http\Controllers;

use App\Models\Favourite;
use App\Models\Ad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FavouriteController extends Controller
{
    /**
     * Get all favourites for the authenticated user
     */
    public function index(Request $request)
    {
        $favourites = Favourite::where('user_id', $request->user()->id)
            ->with(['ad.user', 'ad.category', 'ad.photos'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($favourites);
    }

    /**
     * Add an ad to favourites
     */
    public function store(Request $request)
    {
        $request->validate([
            'ad_id' => 'required|exists:ads,id',
        ]);

        $user = $request->user();
        $adId = $request->ad_id;

        // Check if already favourited
        $existing = Favourite::where('user_id', $user->id)
            ->where('ad_id', $adId)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Ad is already in your favourites',
                'favourite' => $existing,
            ], 200);
        }

        $favourite = Favourite::create([
            'user_id' => $user->id,
            'ad_id' => $adId,
        ]);

        $favourite->load(['ad.user', 'ad.category', 'ad.photos']);

        return response()->json([
            'message' => 'Ad added to favourites',
            'favourite' => $favourite,
        ], 201);
    }

    /**
     * Remove an ad from favourites
     */
    public function destroy(Request $request, $id)
    {
        $favourite = Favourite::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $favourite->delete();

        return response()->json([
            'message' => 'Ad removed from favourites',
        ], 200);
    }

    /**
     * Remove by ad_id (convenience method)
     */
    public function removeByAd(Request $request, $adId)
    {
        $favourite = Favourite::where('user_id', $request->user()->id)
            ->where('ad_id', $adId)
            ->first();

        if ($favourite) {
            $favourite->delete();
            return response()->json([
                'message' => 'Ad removed from favourites',
            ], 200);
        }

        return response()->json([
            'message' => 'Ad not found in favourites',
        ], 404);
    }

    /**
     * Check if an ad is favourited
     */
    public function check(Request $request, $adId)
    {
        $isFavourited = Favourite::where('user_id', $request->user()->id)
            ->where('ad_id', $adId)
            ->exists();

        return response()->json([
            'is_favourited' => $isFavourited,
        ]);
    }
}
