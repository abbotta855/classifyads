<?php

namespace App\Http\Controllers;

use App\Models\Rating;
use App\Models\RatingCriteria;
use App\Models\RatingCriteriaScore;
use App\Models\Ad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RatingController extends Controller
{
    /**
     * Get ratings for a specific seller
     */
    public function getSellerRatings($sellerId)
    {
        $ratings = Rating::with(['user', 'ad', 'criteriaScores.criteria'])
            ->where('seller_id', $sellerId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($rating) {
                return [
                    'id' => $rating->id,
                    'user_name' => $rating->user->name ?? 'Anonymous',
                    'user_profile_picture' => $rating->user->profile_picture ?? null,
                    'rating' => $rating->rating,
                    'comment' => $rating->comment,
                    'ad_title' => $rating->ad->title ?? 'N/A',
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

        // Calculate average rating
        $averageRating = Rating::where('seller_id', $sellerId)->avg('rating') ?? 0;
        $totalRatings = Rating::where('seller_id', $sellerId)->count();

        return response()->json([
            'ratings' => $ratings,
            'average_rating' => round($averageRating, 2),
            'total_ratings' => $totalRatings,
        ]);
    }

    /**
     * Get rating criteria
     */
    public function getCriteria()
    {
        $criteria = RatingCriteria::orderBy('sort_order', 'asc')->get();
        return response()->json($criteria);
    }

    /**
     * Check if user has already rated this seller for this ad
     */
    public function checkRating(Request $request, $adId)
    {
        $user = Auth::user();
        $ad = Ad::findOrFail($adId);
        
        $existingRating = Rating::where('user_id', $user->id)
            ->where('ad_id', $adId)
            ->where('seller_id', $ad->user_id)
            ->first();

        if ($existingRating) {
            return response()->json([
                'has_rated' => true,
                'rating' => $existingRating->load(['criteriaScores.criteria']),
            ]);
        }

        return response()->json(['has_rated' => false]);
    }

    /**
     * Submit a rating
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'ad_id' => 'required|exists:ads,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'criteria_scores' => 'nullable|array',
            'criteria_scores.*.criteria_id' => 'required|exists:rating_criteria,id',
            'criteria_scores.*.score' => 'required|integer|min:1|max:5',
            'purchase_code' => 'nullable|string|max:100',
        ]);

        $ad = Ad::findOrFail($validated['ad_id']);
        $sellerId = $ad->user_id;

        // Prevent rating own ad
        if ($sellerId === $user->id) {
            return response()->json(['error' => 'You cannot rate your own ad.'], 400);
        }

        // Check if user has already rated this ad
        $existingRating = Rating::where('user_id', $user->id)
            ->where('ad_id', $validated['ad_id'])
            ->where('seller_id', $sellerId)
            ->first();

        if ($existingRating) {
            return response()->json(['error' => 'You have already rated this seller for this ad.'], 400);
        }

        DB::beginTransaction();
        try {
            // Create rating
            $rating = Rating::create([
                'user_id' => $user->id,
                'ad_id' => $validated['ad_id'],
                'seller_id' => $sellerId,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                'purchase_verified' => !empty($validated['purchase_code']),
                'purchase_code' => $validated['purchase_code'] ?? null,
            ]);

            // Create criteria scores if provided
            if (!empty($validated['criteria_scores'])) {
                foreach ($validated['criteria_scores'] as $criteriaScore) {
                    RatingCriteriaScore::create([
                        'rating_id' => $rating->id,
                        'rating_criteria_id' => $criteriaScore['criteria_id'],
                        'score' => $criteriaScore['score'],
                    ]);
                }
            }

            DB::commit();

            return response()->json($rating->load(['user', 'seller', 'ad', 'criteriaScores.criteria']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to submit rating: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update a rating
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $rating = Rating::where('user_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'criteria_scores' => 'nullable|array',
            'criteria_scores.*.criteria_id' => 'required|exists:rating_criteria,id',
            'criteria_scores.*.score' => 'required|integer|min:1|max:5',
        ]);

        DB::beginTransaction();
        try {
            // Update rating
            if (isset($validated['rating'])) {
                $rating->rating = $validated['rating'];
            }
            if (isset($validated['comment'])) {
                $rating->comment = $validated['comment'];
            }
            $rating->save();

            // Update criteria scores if provided
            if (!empty($validated['criteria_scores'])) {
                // Delete existing criteria scores
                $rating->criteriaScores()->delete();
                
                // Create new criteria scores
                foreach ($validated['criteria_scores'] as $criteriaScore) {
                    RatingCriteriaScore::create([
                        'rating_id' => $rating->id,
                        'rating_criteria_id' => $criteriaScore['criteria_id'],
                        'score' => $criteriaScore['score'],
                    ]);
                }
            }

            DB::commit();

            return response()->json($rating->load(['user', 'seller', 'ad', 'criteriaScores.criteria']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to update rating: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Delete a rating
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $rating = Rating::where('user_id', $user->id)->findOrFail($id);
        $rating->delete();

        return response()->json(['message' => 'Rating deleted successfully']);
    }
}

