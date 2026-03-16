<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    public function index()
    {
        $offers = Offer::with('vendor')
            ->orderBy('created_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($offers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'vendor_id' => 'required|exists:users,id',
            'offer_percentage' => 'required|numeric|min:0|max:100',
            'created_date' => 'required|date',
            'valid_until' => 'required|date|after:created_date',
            'status' => 'sometimes|in:pending,approved',
        ]);

        $offer = Offer::create($validated);

        return response()->json($offer->load('vendor'), 201);
    }

    public function show(string $id)
    {
        $offer = Offer::with('vendor')->findOrFail($id);
        return response()->json($offer);
    }

    public function update(Request $request, string $id)
    {
        $offer = Offer::findOrFail($id);

        $validated = $request->validate([
            'item_name' => 'sometimes|string|max:255',
            'vendor_id' => 'sometimes|exists:users,id',
            'offer_percentage' => 'sometimes|numeric|min:0|max:100',
            'created_date' => 'sometimes|date',
            'valid_until' => 'sometimes|date|after:created_date',
            'status' => 'sometimes|in:pending,approved',
        ]);

        $offer->update($validated);

        return response()->json($offer->load('vendor'));
    }

    public function destroy(string $id)
    {
        $offer = Offer::findOrFail($id);
        $offer->delete();

        return response()->json(['message' => 'Offer deleted successfully']);
    }

    public function approve(string $id)
    {
        $offer = Offer::findOrFail($id);
        $offer->update(['status' => 'approved']);

        return response()->json($offer->load('vendor'));
    }
}

