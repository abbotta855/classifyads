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
        $user = \App\Models\User::find($sellerId);
        
        // Super admins get perfect 5-star ratings by default
        if ($user && $user->role === 'super_admin') {
            return response()->json([
                'ratings' => [],
                'average_rating' => 5.0,
                'total_ratings' => 1,
                'criteria' => [], // Can be populated with perfect scores if needed
            ]);
        }
        
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
     * @param Request $request - optional 'type' parameter: 'ebook' or 'product'
     */
    public function getCriteria(Request $request)
    {
        $type = $request->input('type', 'product'); // Default to 'product' for backward compatibility
        
        $query = RatingCriteria::where('is_active', true)
            ->orderBy('sort_order', 'asc');
        
        // Filter by criteria type
        if ($type === 'ebook') {
            $query->where(function($q) {
                $q->where('criteria_type', 'ebook')
                  ->orWhere('criteria_type', 'both');
            });
        } elseif ($type === 'product') {
            $query->where(function($q) {
                $q->where('criteria_type', 'product')
                  ->orWhere('criteria_type', 'both');
            });
        }
        
        $criteria = $query->get();
        return response()->json($criteria);
    }

    /**
     * Check if user has already rated this seller for this ad or eBook
     */
    public function checkRating(Request $request, $adId = null)
    {
        $user = Auth::user();
        $ebookId = $request->input('ebook_id');
        
        if ($ebookId) {
            // Check for eBook rating
            $ebook = \App\Models\Ebook::findOrFail($ebookId);
            $existingRating = Rating::where('user_id', $user->id)
                ->where('ebook_id', $ebookId)
                ->where('seller_id', $ebook->user_id)
                ->first();

            if ($existingRating) {
                return response()->json([
                    'has_rated' => true,
                    'rating' => $existingRating->load(['criteriaScores.criteria']),
                ]);
            }
        } elseif ($adId) {
            // Check for ad rating
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
        } else {
            return response()->json(['error' => 'Either ad_id or ebook_id must be provided.'], 400);
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
            'ad_id' => 'nullable|exists:ads,id',
            'ebook_id' => 'nullable|exists:ebooks,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'criteria_scores' => 'nullable|array',
            'criteria_scores.*.criteria_id' => 'required|exists:rating_criteria,id',
            'criteria_scores.*.score' => 'required|integer|min:1|max:5',
            'purchase_code' => 'nullable|string|max:100',
        ]);

        // Ensure either ad_id or ebook_id is provided
        if (empty($validated['ad_id']) && empty($validated['ebook_id'])) {
            return response()->json(['error' => 'Either ad_id or ebook_id must be provided.'], 400);
        }

        if (!empty($validated['ebook_id'])) {
            // eBook rating
            $ebook = \App\Models\Ebook::findOrFail($validated['ebook_id']);
            $sellerId = $ebook->user_id;
        } else {
            // Ad rating
            $ad = Ad::findOrFail($validated['ad_id']);
            $sellerId = $ad->user_id;
        }

        // Prevent rating own ad
        if ($sellerId === $user->id) {
            return response()->json(['error' => 'You cannot rate your own ad.'], 400);
        }

        // Check if user has already rated this item
        $existingRatingQuery = Rating::where('user_id', $user->id)
            ->where('seller_id', $sellerId);
        
        if (!empty($validated['ebook_id'])) {
            $existingRatingQuery->where('ebook_id', $validated['ebook_id']);
        } else {
            $existingRatingQuery->where('ad_id', $validated['ad_id']);
        }
        
        $existingRating = $existingRatingQuery->first();

        if ($existingRating) {
            $itemType = !empty($validated['ebook_id']) ? 'eBook' : 'ad';
            return response()->json(['error' => "You have already rated this seller for this {$itemType}."], 400);
        }

        DB::beginTransaction();
        try {
            // Create rating
            $rating = Rating::create([
                'user_id' => $user->id,
                'ad_id' => $validated['ad_id'] ?? null,
                'ebook_id' => $validated['ebook_id'] ?? null,
                'seller_id' => $sellerId,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                'purchase_verified' => !empty($validated['purchase_code']),
                'purchase_code' => $validated['purchase_code'] ?? null,
            ]);

            // If this is an eBook rating, update the eBook's overall rating
            if (!empty($validated['ebook_id'])) {
                $this->updateEbookOverallRating($validated['ebook_id']);
            }

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

            // If this is an eBook rating, update the eBook's overall rating
            if ($rating->ebook_id) {
                $this->updateEbookOverallRating($rating->ebook_id);
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
        $ebookId = $rating->ebook_id; // Store before deletion
        
        $rating->delete();

        // If this was an eBook rating, update the eBook's overall rating
        if ($ebookId) {
            $this->updateEbookOverallRating($ebookId);
        }

        return response()->json(['message' => 'Rating deleted successfully']);
    }

    /**
     * Update eBook overall rating based on all ratings
     */
    private function updateEbookOverallRating($ebookId)
    {
        $ebook = \App\Models\Ebook::findOrFail($ebookId);
        
        // Get all ratings for this eBook
        $ratings = Rating::where('ebook_id', $ebookId)
            ->whereNotNull('rating')
            ->get();
        
        if ($ratings->isEmpty()) {
            $ebook->overall_rating = 0;
        } else {
            // Calculate average of all ratings
            $averageRating = $ratings->avg('rating');
            $ebook->overall_rating = round($averageRating, 2);
        }
        
        $ebook->save();
    }
}

