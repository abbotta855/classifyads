<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Services\SavedSearchNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdController extends Controller
{
  /**
   * Display a listing of the resource.
   */
  public function index()
  {
    try {
      $ads = Ad::with(['category', 'user', 'location'])
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
            'category' => $ad->category ? ($ad->category->domain_category ?? $ad->category->category ?? null) : null,
            'subcategory' => $ad->category && $ad->category->field_category 
              ? $ad->category->field_category 
              : ($ad->category && $ad->category->sub_category ? $ad->category->sub_category : null),
            'sub_category' => $ad->category && $ad->category->field_category 
              ? $ad->category->field_category 
              : ($ad->category && $ad->category->sub_category ? $ad->category->sub_category : null),
            'location' => $locationString,
            'location_id' => $ad->location_id,
            'selected_local_address_index' => $ad->selected_local_address_index,
            'user_id' => $ad->user_id,
            'user' => $ad->user ? [
              'id' => $ad->user->id,
              'name' => $ad->user->name,
              'email' => $ad->user->email,
            ] : null,
            'status' => $ad->status,
            'views' => $ad->views ?? 0,
            'created_at' => $ad->created_at->toIso8601String(),
            'updated_at' => $ad->updated_at->toIso8601String(),
            'date' => $ad->created_at->toIso8601String(),
            'image1_url' => $ad->image1_url,
            'image2_url' => $ad->image2_url,
            'image3_url' => $ad->image3_url,
            'image4_url' => $ad->image4_url,
            'posted_by' => $ad->posted_by,
          ];
        });

      // Get ad totals
      $totals = [
        'userPosted' => Ad::where('posted_by', 'user')->count(),
        'vendorPosted' => Ad::where('posted_by', 'vendor')->count(),
        'adminPosted' => Ad::where('posted_by', 'admin')->count(),
        'total' => Ad::count(),
      ];

      return response()->json([
        'ads' => $ads,
        'totals' => $totals,
      ]);
    } catch (\Exception $e) {
      return response()->json(['error' => $e->getMessage()], 500);
    }
  }

  /**
   * Store a newly created resource in storage.
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
      'user_id' => 'required|exists:users,id',
      'posted_by' => 'required|in:user,vendor,admin',
      'location_id' => 'nullable|exists:locations,id',
      'selected_local_address' => 'nullable|string', // Address index as string (e.g., "0", "1", "2")
      'images' => 'required|array|min:1|max:4',
      'images.*' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // Max 2MB per image
    ]);

    // Handle image uploads first
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

    // Create the ad with image URLs
    $ad = Ad::create([
      'title' => $validated['title'],
      'description' => $validated['description'],
      'price' => $validated['price'],
      'category_id' => $validated['category_id'],
      'user_id' => $validated['user_id'],
      'posted_by' => $validated['posted_by'],
      'location_id' => $validated['location_id'] ?? null,
      'selected_local_address_index' => $addressIndex,
      'status' => 'active',
      'image1_url' => $imageUrls[0],
      'image2_url' => $imageUrls[1],
      'image3_url' => $imageUrls[2],
      'image4_url' => $imageUrls[3],
    ]);

    // Load relationships
    $ad->load(['category', 'user', 'location']);

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
   * Display the specified resource.
   */
  public function show(string $id)
  {
    $ad = Ad::with(['category', 'user'])->findOrFail($id);
    return response()->json($ad);
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, string $id)
  {
    $ad = Ad::findOrFail($id);

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
      'user_id' => 'sometimes|exists:users,id',
      'location_id' => 'nullable|exists:locations,id',
      'posted_by' => 'sometimes|in:user,vendor,admin',
      'status' => 'sometimes|in:draft,active,sold,expired,removed',
    ]);

    $ad->update($validated);

    // Load relationships
    $ad->load(['category', 'user']);

    return response()->json($ad);
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(string $id)
  {
    $ad = Ad::findOrFail($id);
    $ad->delete();

    return response()->json(['message' => 'Ad deleted successfully']);
  }
}
