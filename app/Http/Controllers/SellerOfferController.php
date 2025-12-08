<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Models\Ad;
use Illuminate\Http\Request;

class SellerOfferController extends Controller
{
    /**
     * Get all offers for the authenticated seller
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $offers = Offer::where('vendor_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($offers);
    }

    /**
     * Create a new offer for a specific ad
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'ad_id' => 'required|exists:ads,id',
            'offer_percentage' => 'required|numeric|min:1|max:100',
            'valid_until' => 'required|date|after:today',
        ]);

        $ad = Ad::findOrFail($validated['ad_id']);

        // Verify the ad belongs to the seller
        if ($ad->user_id !== $user->id) {
            return response()->json(['error' => 'You can only create offers for your own ads'], 403);
        }

        $offer = Offer::create([
            'item_name' => $ad->title,
            'vendor_id' => $user->id,
            'offer_percentage' => $validated['offer_percentage'],
            'created_date' => now(),
            'valid_until' => $validated['valid_until'],
            'status' => 'pending', // Requires admin approval
        ]);

        return response()->json($offer, 201);
    }

    /**
     * Update an offer
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        $offer = Offer::where('vendor_id', $user->id)->findOrFail($id);

        // Can only update pending offers
        if ($offer->status !== 'pending') {
            return response()->json(['error' => 'You can only update pending offers'], 400);
        }

        $validated = $request->validate([
            'offer_percentage' => 'sometimes|numeric|min:1|max:100',
            'valid_until' => 'sometimes|date|after:today',
        ]);

        $offer->update($validated);

        return response()->json($offer);
    }

    /**
     * Delete an offer
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        $offer = Offer::where('vendor_id', $user->id)->findOrFail($id);

        // Can only delete pending offers
        if ($offer->status !== 'pending') {
            return response()->json(['error' => 'You can only delete pending offers'], 400);
        }

        $offer->delete();

        return response()->json(['message' => 'Offer deleted successfully']);
    }

    /**
     * Get offers for a specific ad
     */
    public function getAdOffers(Request $request, $adId)
    {
        $user = $request->user();
        $ad = Ad::findOrFail($adId);

        // Verify the ad belongs to the seller
        if ($ad->user_id !== $user->id) {
            return response()->json(['error' => 'You can only view offers for your own ads'], 403);
        }

        $offers = Offer::where('vendor_id', $user->id)
            ->where('item_name', 'like', '%' . $ad->title . '%')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($offers);
    }
}

