<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use App\Services\SavedSearchNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UserAdController extends Controller
{
    /**
     * Get all ads for the authenticated user
     */
    public function index()
    {
        $ads = Ad::with(['category', 'location'])
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($ad) {
                // Build category string from hierarchy (domain > field > item)
                $categoryString = null;
                if ($ad->category) {
                    $categoryParts = [];
                    if ($ad->category->domain_category) {
                        $categoryParts[] = $ad->category->domain_category;
                    }
                    if ($ad->category->field_category) {
                        $categoryParts[] = $ad->category->field_category;
                    }
                    if ($ad->category->item_category) {
                        $categoryParts[] = $ad->category->item_category;
                    }
                    if (!empty($categoryParts)) {
                        $categoryString = implode(' > ', $categoryParts);
                    }
                }
                
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
                
                return [
                    'id' => $ad->id,
                    'title' => $ad->title,
                    'description' => $ad->description,
                    'price' => (float) $ad->price,
                    'category_id' => $ad->category_id,
                    'category_path' => $categoryString, // Full hierarchy path (domain > field > item)
                    'category' => $ad->category ? [
                        'id' => $ad->category->id,
                        'domain_category' => $ad->category->domain_category,
                        'field_category' => $ad->category->field_category,
                        'item_category' => $ad->category->item_category,
                        // Backward compatibility
                        'category' => $ad->category->domain_category ?? $ad->category->category ?? null,
                        'sub_category' => $ad->category->field_category ?? $ad->category->sub_category ?? null,
                    ] : null,
                    'location' => $ad->location ? [
                        'id' => $ad->location->id,
                        'name' => $locationString,
                    ] : null,
                    'location_id' => $ad->location_id,
                    'selected_local_address_index' => $ad->selected_local_address_index,
                    'status' => $ad->status,
                    'item_sold' => $ad->status === 'sold',
                    'views' => $ad->views ?? 0,
                    'image1_url' => $ad->image1_url,
                    'image2_url' => $ad->image2_url,
                    'image3_url' => $ad->image3_url,
                    'image4_url' => $ad->image4_url,
                    'created_at' => $ad->created_at->toIso8601String(),
                    'updated_at' => $ad->updated_at->toIso8601String(),
                ];
            });

        return response()->json($ads);
    }

    /**
     * Store a newly created ad
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:90',
            'description' => ['required', 'string', function ($attribute, $value, $fail) {
                $wordCount = str_word_count(strip_tags($value));
                if ($wordCount > 300) {
                    $fail('The description must not exceed 300 words. Current: ' . $wordCount . ' words.');
                }
            }],
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'location_id' => 'nullable|exists:locations,id',
            'selected_local_address' => 'nullable|string', // Address index as string (e.g., "0", "1", "2")
            'images' => 'required|array|min:1|max:4',
            'images.*' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle image uploads
        $imageUrls = [null, null, null, null];
        
        if ($request->hasFile('images')) {
            $images = $request->file('images');
            
            foreach ($images as $index => $image) {
                if ($image && $image->isValid() && $index < 4) {
                    // Store the image in public storage
                    $path = $image->store('ads/photos', 'public');
                    
                    // Store the URL
                    $imageUrls[$index] = Storage::url($path);
                }
            }
        }

        // Extract address index from selected_local_address (format: "0", "1", "2", etc.)
        $addressIndex = null;
        if (!empty($validated['selected_local_address'])) {
            $addressIndexStr = $validated['selected_local_address'];
            // Convert string to integer (e.g., "0" -> 0, "1" -> 1)
            $addressIndex = is_numeric($addressIndexStr) ? (int) $addressIndexStr : null;
        }

        // Create the ad
        $ad = Ad::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'price' => $validated['price'],
            'category_id' => $validated['category_id'],
            'user_id' => Auth::id(),
            'posted_by' => 'user',
            'location_id' => $validated['location_id'] ?? null,
            'selected_local_address_index' => $addressIndex,
            'status' => 'active',
            'views' => 0,
            'image1_url' => $imageUrls[0],
            'image2_url' => $imageUrls[1],
            'image3_url' => $imageUrls[2],
            'image4_url' => $imageUrls[3],
        ]);

        // Load relationships
        $ad->load(['category', 'location']);

        // Process saved search alerts (only for active ads)
        if ($ad->status === 'active') {
            try {
                $notificationService = new SavedSearchNotificationService();
                $notificationService->processAd($ad);
            } catch (\Exception $e) {
                // Log error but don't fail ad creation
                \Log::error('Failed to process saved search alerts: ' . $e->getMessage(), [
                    'ad_id' => $ad->id,
                    'exception' => $e
                ]);
            }
        }

        return response()->json($ad, 201);
    }

    /**
     * Update the specified ad
     */
    public function update(Request $request, $id)
    {
        $ad = Ad::where('user_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:90',
            'description' => ['sometimes', 'string', function ($attribute, $value, $fail) {
                if ($value) {
                    $wordCount = str_word_count(strip_tags($value));
                    if ($wordCount > 300) {
                        $fail('The description must not exceed 300 words. Current: ' . $wordCount . ' words.');
                    }
                }
            }],
            'price' => 'sometimes|numeric|min:0',
            'category_id' => 'sometimes|exists:categories,id',
            'location_id' => 'nullable|exists:locations,id',
            'selected_local_address' => 'nullable|string', // Address index as string (e.g., "0", "1", "2")
            'images' => 'sometimes|array|max:4',
            'images.*' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Handle image uploads if provided
        if ($request->hasFile('images')) {
            $images = $request->file('images');
            $imageUrls = [
                $ad->image1_url,
                $ad->image2_url,
                $ad->image3_url,
                $ad->image4_url,
            ];
            
            foreach ($images as $index => $image) {
                if ($image && $image->isValid() && $index < 4) {
                    // Delete old image if exists
                    if ($imageUrls[$index]) {
                        $oldPath = str_replace('/storage/', '', $imageUrls[$index]);
                        Storage::disk('public')->delete($oldPath);
                    }
                    
                    // Store new image
                    $path = $image->store('ads/photos', 'public');
                    $imageUrls[$index] = Storage::url($path);
                }
            }
            
            $validated['image1_url'] = $imageUrls[0];
            $validated['image2_url'] = $imageUrls[1];
            $validated['image3_url'] = $imageUrls[2];
            $validated['image4_url'] = $imageUrls[3];
        }

        // Extract address index from selected_local_address if provided
        if (isset($validated['selected_local_address'])) {
            $addressIndex = null;
            if (!empty($validated['selected_local_address'])) {
                $addressIndexStr = $validated['selected_local_address'];
                // Convert string to integer (e.g., "0" -> 0, "1" -> 1)
                $addressIndex = is_numeric($addressIndexStr) ? (int) $addressIndexStr : null;
            }
            $validated['selected_local_address_index'] = $addressIndex;
            unset($validated['selected_local_address']); // Remove the string field, we only store the index
        }

        $ad->update($validated);
        $ad->load(['category', 'location']);

        return response()->json($ad);
    }

    /**
     * Delete the specified ad
     */
    public function destroy($id)
    {
        $ad = Ad::where('user_id', Auth::id())->findOrFail($id);

        // Delete associated images
        foreach ([$ad->image1_url, $ad->image2_url, $ad->image3_url, $ad->image4_url] as $imageUrl) {
            if ($imageUrl) {
                $path = str_replace('/storage/', '', $imageUrl);
                Storage::disk('public')->delete($path);
            }
        }

        $ad->delete();

        return response()->json(['message' => 'Ad deleted successfully']);
    }

    /**
     * Mark ad as sold
     */
    public function markSold($id)
    {
        $ad = Ad::where('user_id', Auth::id())->findOrFail($id);
        
        $ad->update([
            'status' => 'sold',
        ]);

        return response()->json($ad);
    }

    /**
     * Increment view count for an ad and track recently viewed
     */
    public function incrementView(Request $request, $id)
    {
        $ad = Ad::findOrFail($id);
        $ad->increment('views');
        
        // Track recently viewed if user is authenticated
        if ($request->user()) {
            \App\Models\RecentlyViewed::updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'ad_id' => $ad->id,
                ],
                [
                    'viewed_at' => now(),
                ]
            );
        }
        
        return response()->json(['views' => $ad->views]);
    }
}