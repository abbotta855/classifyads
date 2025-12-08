<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use Illuminate\Http\Request;

class AdController extends Controller
{
    /**
     * Display a listing of active ads for public homepage
     */
    public function index()
    {
        try {
            $ads = Ad::with(['category', 'location'])
                ->where('status', 'active')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($ad) {
                    // Build location string from hierarchy
                    $locationString = null;
                    if ($ad->location) {
                        $parts = [];
                        if ($ad->location->province) $parts[] = $ad->location->province;
                        if ($ad->location->district) $parts[] = $ad->location->district;
                        if ($ad->location->local_level) $parts[] = $ad->location->local_level;
                        if ($ad->location->ward_number) $parts[] = 'Ward ' . $ad->location->ward_number;
                        if ($ad->location->local_address) {
                            // Get first local address if multiple
                            $addresses = explode(', ', $ad->location->local_address);
                            if (!empty($addresses[0])) {
                                $parts[] = $addresses[0];
                            }
                        }
                        $locationString = implode(' > ', $parts);
                    }

                    // Get primary image (use first available image)
                    $image = $ad->image1_url 
                        ?? $ad->image2_url 
                        ?? $ad->image3_url 
                        ?? $ad->image4_url 
                        ?? 'https://via.placeholder.com/1200x1200?text=No+Image';

                    // Get category name
                    $categoryName = $ad->category ? $ad->category->category : 'Uncategorized';
                    $subcategoryName = $ad->category && $ad->category->sub_category 
                        ? $ad->category->sub_category 
                        : null;

                    return [
                        'id' => $ad->id,
                        'title' => $ad->title,
                        'description' => $ad->description,
                        'price' => (float) $ad->price,
                        'image' => $image,
                        'category' => $categoryName,
                        'subcategory' => $subcategoryName,
                        'sub_category' => $subcategoryName, // For backward compatibility
                        'location' => $locationString,
                        'location_id' => $ad->location_id,
                        'user_id' => $ad->user_id, // Add seller user ID
                        'locationHierarchy' => $ad->location ? [
                            'province' => $ad->location->province,
                            'district' => $ad->location->district,
                            'localLevel' => $ad->location->local_level,
                            'ward' => $ad->location->ward_number,
                        ] : null,
                        'created_at' => $ad->created_at->toIso8601String(),
                    ];
                });

            return response()->json([
                'ads' => $ads,
                'total' => $ads->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'ads' => [],
                'total' => 0,
            ], 500);
        }
    }
}
