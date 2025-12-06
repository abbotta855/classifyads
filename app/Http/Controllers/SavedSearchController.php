<?php

namespace App\Http\Controllers;

use App\Models\SavedSearch;
use Illuminate\Http\Request;

class SavedSearchController extends Controller
{
    /**
     * Get all saved searches for the authenticated user
     */
    public function index(Request $request)
    {
        $searches = SavedSearch::where('user_id', $request->user()->id)
            ->with(['category', 'location'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($searches);
    }

    /**
     * Create a new saved search
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'search_query' => 'nullable|string|max:500',
            'category_id' => 'nullable|exists:categories,id',
            'location_id' => 'nullable|exists:locations,id',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0|gte:min_price',
            'filters' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $validated['user_id'] = $request->user()->id;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $savedSearch = SavedSearch::create($validated);
        $savedSearch->load(['category', 'location']);

        return response()->json([
            'message' => 'Search saved successfully',
            'saved_search' => $savedSearch,
        ], 201);
    }

    /**
     * Update a saved search
     */
    public function update(Request $request, $id)
    {
        $savedSearch = SavedSearch::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'search_query' => 'nullable|string|max:500',
            'category_id' => 'nullable|exists:categories,id',
            'location_id' => 'nullable|exists:locations,id',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0|gte:min_price',
            'filters' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $savedSearch->update($validated);
        $savedSearch->load(['category', 'location']);

        return response()->json([
            'message' => 'Search updated successfully',
            'saved_search' => $savedSearch,
        ]);
    }

    /**
     * Delete a saved search
     */
    public function destroy(Request $request, $id)
    {
        $savedSearch = SavedSearch::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $savedSearch->delete();

        return response()->json([
            'message' => 'Search deleted successfully',
        ], 200);
    }

    /**
     * Toggle active status
     */
    public function toggleActive(Request $request, $id)
    {
        $savedSearch = SavedSearch::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $savedSearch->is_active = !$savedSearch->is_active;
        $savedSearch->save();

        return response()->json([
            'message' => $savedSearch->is_active ? 'Search alerts enabled' : 'Search alerts disabled',
            'saved_search' => $savedSearch,
        ]);
    }
}
