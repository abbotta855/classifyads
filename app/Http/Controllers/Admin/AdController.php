<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Services\NepaliAutoTranslationService;
use App\Services\SavedSearchNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdController extends Controller
{
  private function isNepaliRequest(Request $request): bool
  {
    $lang = strtolower((string) ($request->header('X-Language') ?? $request->query('lang', 'en')));
    return str_starts_with($lang, 'ne');
  }

  /**
   * Display a listing of the resource.
   */
  public function index(Request $request)
  {
    $isNepali = $this->isNepaliRequest($request);
    try {
      $ads = Ad::with(['category', 'user', 'location'])
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($ad) use ($isNepali) {
          // Build category string from hierarchy (domain > field > item)
          $categoryString = null;
          if ($ad->category) {
            $categoryParts = [];
            $domainName = $isNepali ? ($ad->category->domain_category_ne ?: $ad->category->domain_category) : $ad->category->domain_category;
            $fieldName = $isNepali ? ($ad->category->field_category_ne ?: $ad->category->field_category) : $ad->category->field_category;
            $itemName = $isNepali ? ($ad->category->item_category_ne ?: $ad->category->item_category) : $ad->category->item_category;
            if ($domainName) {
              $categoryParts[] = $domainName;
            }
            if ($fieldName) {
              $categoryParts[] = $fieldName;
            }
            if ($itemName) {
              $categoryParts[] = $itemName;
            }
            if (!empty($categoryParts)) {
              $categoryString = implode(' > ', $categoryParts);
            }
          }
          
          // Build location string from hierarchy
          $locationString = null;
          if ($ad->location) {
            $parts = [];
            $province = $isNepali ? ($ad->location->province_ne ?: $ad->location->province) : $ad->location->province;
            $district = $isNepali ? ($ad->location->district_ne ?: $ad->location->district) : $ad->location->district;
            $localLevel = $isNepali ? ($ad->location->local_level_ne ?: $ad->location->local_level) : $ad->location->local_level;
            $localAddress = $isNepali ? ($ad->location->local_address_ne ?: $ad->location->local_address) : $ad->location->local_address;
            if ($province) $parts[] = $province;
            if ($district) $parts[] = $district;
            if ($localLevel) $parts[] = $localLevel;
            if ($ad->location->ward_number) $parts[] = ($isNepali ? 'वडा ' : 'Ward ') . $ad->location->ward_number;
            if ($localAddress) {
              $addresses = explode(', ', $localAddress);
              if (!empty($addresses[0])) {
                $parts[] = $addresses[0];
              }
            }
            $locationString = implode(' > ', $parts);
          }
          
          return [
            'id' => $ad->id,
            'title' => $isNepali ? ($ad->title_ne ?: $ad->title) : $ad->title,
            'description' => $isNepali ? ($ad->description_ne ?: $ad->description) : $ad->description,
            'price' => (float) $ad->price,
            'category_id' => $ad->category_id,
            'category_path' => $categoryString, // Full hierarchy path (domain > field > item)
            'category' => $ad->category ? ($isNepali ? (($ad->category->domain_category_ne ?: $ad->category->domain_category) ?? $ad->category->category ?? null) : ($ad->category->domain_category ?? $ad->category->category ?? null)) : null,
            'subcategory' => $ad->category && $ad->category->field_category 
              ? ($isNepali ? ($ad->category->field_category_ne ?: $ad->category->field_category) : $ad->category->field_category)
              : ($ad->category && $ad->category->sub_category ? $ad->category->sub_category : null),
            'sub_category' => $ad->category && $ad->category->field_category 
              ? ($isNepali ? ($ad->category->field_category_ne ?: $ad->category->field_category) : $ad->category->field_category)
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
    $translator = app(NepaliAutoTranslationService::class);
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
      'title_ne' => $translator->translateToNepali($validated['title']),
      'description' => $validated['description'],
      'description_ne' => $translator->translateToNepali($validated['description']),
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
    $translator = app(NepaliAutoTranslationService::class);
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

    if (isset($validated['title'])) {
      $validated['title_ne'] = $translator->translateToNepali($validated['title']);
    }
    if (isset($validated['description'])) {
      $validated['description_ne'] = $translator->translateToNepali($validated['description']);
    }

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
