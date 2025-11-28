<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Rating;
use App\Models\RatingCriteria;
use App\Models\RatingCriteriaScore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RatingController extends Controller
{
    public function index()
    {
        // Get ratings with user, seller, ad, and criteria scores relationships
        $ratings = Rating::with(['user', 'seller', 'ad', 'criteriaScores.criteria'])
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($rating) {
                // Calculate average rating as seller for this seller
                $avgRatingAsSeller = Rating::where('seller_id', $rating->seller_id)
                    ->avg('rating') ?? 0;

                // Calculate average rating as buyer for this reviewer
                $avgRatingAsBuyer = Rating::where('user_id', $rating->user_id)
                    ->avg('rating') ?? 0;

                // Overall rating (average of seller and buyer ratings, or just the current rating)
                $overallRating = ($avgRatingAsSeller + $avgRatingAsBuyer) / 2;
                if ($avgRatingAsSeller == 0 || $avgRatingAsBuyer == 0) {
                    $overallRating = $rating->rating;
                }

                // Get criteria scores for this rating
                $criteriaScores = $rating->criteriaScores->map(function ($score) {
                    return [
                        'criteria_id' => $score->rating_criteria_id,
                        'criteria_name' => $score->criteria->name ?? 'N/A',
                        'score' => $score->score,
                    ];
                });

                return [
                    'id' => $rating->id,
                    'user_id' => $rating->user_id,
                    'user_name' => $rating->user->name ?? 'N/A',
                    'rating' => $rating->rating,
                    'seller_id' => $rating->seller_id,
                    'seller_name' => $rating->seller->name ?? 'N/A',
                    'rating_as_seller' => round($avgRatingAsSeller, 2),
                    'rating_as_buyer' => round($avgRatingAsBuyer, 2),
                    'overall_rating' => round($overallRating, 2),
                    'comment' => $rating->comment,
                    'ad_id' => $rating->ad_id,
                    'ad_title' => $rating->ad->title ?? 'N/A',
                    'purchase_verified' => $rating->purchase_verified,
                    'purchase_code' => $rating->purchase_code,
                    'criteria_scores' => $criteriaScores,
                    'created_at' => $rating->created_at,
                    'updated_at' => $rating->updated_at,
                ];
            });

        return response()->json($ratings);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'ad_id' => 'required|exists:ads,id',
            'seller_id' => 'required|exists:users,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
            'purchase_verified' => 'sometimes|boolean',
            'purchase_code' => 'nullable|string|max:100|unique:ratings,purchase_code',
        ]);

        $rating = Rating::create($validated);

        return response()->json($rating->load(['user', 'seller', 'ad']), 201);
    }

    public function show(string $id)
    {
        $rating = Rating::with(['user', 'seller', 'ad'])->findOrFail($id);
        return response()->json($rating);
    }

    public function update(Request $request, string $id)
    {
        $rating = Rating::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'sometimes|exists:users,id',
            'ad_id' => 'sometimes|exists:ads,id',
            'seller_id' => 'sometimes|exists:users,id',
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string',
            'purchase_verified' => 'sometimes|boolean',
            'purchase_code' => 'nullable|string|max:100|unique:ratings,purchase_code,' . $id,
        ]);

        $rating->update($validated);

        return response()->json($rating->load(['user', 'seller', 'ad']));
    }

    public function destroy(string $id)
    {
        $rating = Rating::findOrFail($id);
        $rating->delete();

        return response()->json(['message' => 'Rating deleted successfully']);
    }
}

