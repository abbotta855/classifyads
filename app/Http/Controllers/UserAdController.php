<?php

namespace App\Http\Controllers;

use App\Models\Ad;
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
            ->get();

        return response()->json($ads);
    }

    /**
     * Store a newly created ad
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'location_id' => 'nullable|exists:locations,id',
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

        // Create the ad
        $ad = Ad::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'price' => $validated['price'],
            'category_id' => $validated['category_id'],
            'user_id' => Auth::id(),
            'posted_by' => 'user',
            'location_id' => $validated['location_id'] ?? null,
            'status' => 'active',
            'views' => 0,
            'item_sold' => false,
            'image1_url' => $imageUrls[0],
            'image2_url' => $imageUrls[1],
            'image3_url' => $imageUrls[2],
            'image4_url' => $imageUrls[3],
        ]);

        // Load relationships
        $ad->load(['category', 'location']);

        return response()->json($ad, 201);
    }

    /**
     * Update the specified ad
     */
    public function update(Request $request, $id)
    {
        $ad = Ad::where('user_id', Auth::id())->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'category_id' => 'sometimes|exists:categories,id',
            'location_id' => 'nullable|exists:locations,id',
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
            'item_sold' => true,
            'status' => 'sold',
        ]);

        return response()->json($ad);
    }

    /**
     * Increment view count for an ad
     */
    public function incrementView($id)
    {
        $ad = Ad::findOrFail($id);
        $ad->increment('views');
        
        return response()->json(['views' => $ad->views]);
    }
}
