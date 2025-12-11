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
        ->get();

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
      'title' => 'required|string|max:255',
      'description' => 'required|string',
      'price' => 'required|numeric|min:0',
      'category_id' => 'required|exists:categories,id',
      'user_id' => 'required|exists:users,id',
      'posted_by' => 'required|in:user,vendor,admin',
      'location_id' => 'nullable|exists:locations,id',
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

    // Create the ad with image URLs
    $ad = Ad::create([
      'title' => $validated['title'],
      'description' => $validated['description'],
      'price' => $validated['price'],
      'category_id' => $validated['category_id'],
      'user_id' => $validated['user_id'],
      'posted_by' => $validated['posted_by'],
      'location_id' => $validated['location_id'] ?? null,
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
      'title' => 'sometimes|string|max:255',
      'description' => 'sometimes|string',
      'price' => 'sometimes|numeric|min:0',
      'category_id' => 'sometimes|exists:categories,id',
      'user_id' => 'sometimes|exists:users,id',
      'location_id' => 'nullable|exists:locations,id',
      'posted_by' => 'sometimes|in:user,vendor,admin',
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
