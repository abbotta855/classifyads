<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use App\Models\AdClick;
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

    /**
     * Display a single ad by ID (public)
     */
    public function show($id)
    {
        try {
            $ad = Ad::with(['category', 'location', 'user'])
                ->where('id', $id)
                ->where('status', 'active')
                ->firstOrFail();

            // Build location string from hierarchy
            $locationString = null;
            if ($ad->location) {
                $parts = [];
                if ($ad->location->province) $parts[] = $ad->location->province;
                if ($ad->location->district) $parts[] = $ad->location->district;
                if ($ad->location->local_level) $parts[] = $ad->location->local_level;
                if ($ad->location->ward_number) $parts[] = 'Ward ' . $ad->location->ward_number;
                if ($ad->location->local_address) {
                    $addresses = explode(', ', $ad->location->local_address);
                    if (!empty($addresses[0])) {
                        $parts[] = $addresses[0];
                    }
                }
                $locationString = implode(' > ', $parts);
            }

            // Get all images
            $images = [];
            if ($ad->image1_url) $images[] = $ad->image1_url;
            if ($ad->image2_url) $images[] = $ad->image2_url;
            if ($ad->image3_url) $images[] = $ad->image3_url;
            if ($ad->image4_url) $images[] = $ad->image4_url;
            
            // If no images, add placeholder
            if (empty($images)) {
                $images[] = 'https://via.placeholder.com/1200x1200?text=No+Image';
            }

            // Get category info
            $categoryName = $ad->category ? $ad->category->category : 'Uncategorized';
            $subcategoryName = $ad->category && $ad->category->sub_category 
                ? $ad->category->sub_category 
                : null;

            // Get seller info (limited)
            $seller = null;
            if ($ad->user) {
                $seller = [
                    'id' => $ad->user->id,
                    'name' => $ad->user->name,
                    'profile_picture' => $ad->user->profile_picture,
                    'location' => $ad->user->locationRelation ? [
                        'id' => $ad->user->locationRelation->id,
                        'name' => $ad->user->locationRelation->name,
                    ] : null,
                ];
            }

            return response()->json([
                'id' => $ad->id,
                'title' => $ad->title,
                'description' => $ad->description,
                'price' => (float) $ad->price,
                'images' => $images,
                'image' => $images[0], // Primary image for backward compatibility
                'category' => $categoryName,
                'subcategory' => $subcategoryName,
                'sub_category' => $subcategoryName,
                'location' => $locationString,
                'location_id' => $ad->location_id,
                'user_id' => $ad->user_id,
                'seller' => $seller,
                'views' => $ad->views ?? 0,
                'item_sold' => $ad->status === 'sold',
                'status' => $ad->status,
                'featured' => $ad->featured ?? false,
                'locationHierarchy' => $ad->location ? [
                    'province' => $ad->location->province,
                    'district' => $ad->location->district,
                    'localLevel' => $ad->location->local_level,
                    'ward' => $ad->location->ward_number,
                ] : null,
                'created_at' => $ad->created_at->toIso8601String(),
                'updated_at' => $ad->updated_at->toIso8601String(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Ad not found',
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Track a click on an ad
     */
    public function trackClick(Request $request, $id)
    {
        try {
            $ad = Ad::findOrFail($id);

            // Get user if authenticated
            $userId = $request->user() ? $request->user()->id : null;

            // Create click record
            AdClick::create([
                'ad_id' => $ad->id,
                'user_id' => $userId,
                'clicked_at' => now(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'message' => 'Click tracked',
                'ad_id' => $ad->id,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to track click',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
