<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Ad;
use App\Models\Rating;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class PublicProfileController extends Controller
{
    /**
     * Get public profile information for a user
     */
    public function show($userId)
    {
        $user = User::with('locationRelation')
            ->where('id', $userId)
            ->where('role', '!=', 'super_admin') // Don't expose super admin profiles
            ->firstOrFail();

        // Get user's active ads
        $ads = Ad::with(['category', 'location'])
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->limit(12)
            ->get();

        // Get user's rating statistics
        $ratings = Rating::where('seller_id', $userId)->get();
        $averageRating = $ratings->avg('rating') ?? 0;
        $totalRatings = $ratings->count();
        
        // Get rating distribution
        $ratingDistribution = [
            5 => $ratings->where('rating', 5)->count(),
            4 => $ratings->where('rating', 4)->count(),
            3 => $ratings->where('rating', 3)->count(),
            2 => $ratings->where('rating', 2)->count(),
            1 => $ratings->where('rating', 1)->count(),
        ];

        // Get recent reviews (last 5)
        $recentReviews = Rating::with(['user', 'ad'])
            ->where('seller_id', $userId)
            ->whereNotNull('comment')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($rating) {
                return [
                    'id' => $rating->id,
                    'user_name' => $rating->user->name ?? 'Anonymous',
                    'user_profile_picture' => $rating->user->profile_picture ?? null,
                    'rating' => $rating->rating,
                    'comment' => $rating->comment,
                    'ad_title' => $rating->ad->title ?? 'N/A',
                    'created_at' => $rating->created_at,
                ];
            });

        // Get total ads count
        $totalAds = Ad::where('user_id', $userId)->count();
        $soldAds = Ad::where('user_id', $userId)->where('status', 'sold')->count();

        // Safely get show_phone - check if column exists in database
        $showPhone = true; // default value
        if (Schema::hasColumn('users', 'show_phone')) {
            $showPhone = $user->show_phone ?? true;
        }
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'profile_picture' => $user->profile_picture,
                'phone' => $showPhone ? $user->phone : null, // Only include phone if user allows it
                'email' => $user->email, // Include email for contact
                'location' => $user->locationRelation ? [
                    'id' => $user->locationRelation->id,
                    'name' => $user->locationRelation->name,
                ] : null,
                'selected_local_address' => $user->selected_local_address,
                'created_at' => $user->created_at,
            ],
            'stats' => [
                'total_ads' => $totalAds,
                'active_ads' => $ads->count(),
                'sold_ads' => $soldAds,
                'average_rating' => round($averageRating, 2),
                'total_ratings' => $totalRatings,
                'rating_distribution' => $ratingDistribution,
            ],
            'ads' => $ads,
            'recent_reviews' => $recentReviews,
        ]);
    }

    /**
     * Get all ratings for a user (paginated)
     */
    public function getRatings($userId, Request $request)
    {
        $perPage = $request->get('per_page', 10);
        
        $ratings = Rating::with(['user', 'ad', 'criteriaScores.criteria'])
            ->where('seller_id', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $ratings->getCollection()->transform(function ($rating) {
            return [
                'id' => $rating->id,
                'user_name' => $rating->user->name ?? 'Anonymous',
                'user_profile_picture' => $rating->user->profile_picture ?? null,
                'rating' => $rating->rating,
                'comment' => $rating->comment,
                'ad_title' => $rating->ad->title ?? 'N/A',
                'ad_id' => $rating->ad_id,
                'purchase_verified' => $rating->purchase_verified,
                'criteria_scores' => $rating->criteriaScores->map(function ($score) {
                    return [
                        'criteria_name' => $score->criteria->name ?? 'N/A',
                        'score' => $score->score,
                    ];
                }),
                'created_at' => $rating->created_at,
            ];
        });

        return response()->json($ratings);
    }
}

