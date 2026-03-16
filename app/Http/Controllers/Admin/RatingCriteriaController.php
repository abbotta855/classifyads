<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RatingCriteria;
use Illuminate\Http\Request;

class RatingCriteriaController extends Controller
{
    public function index()
    {
        $criteria = RatingCriteria::orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->get();
        
        return response()->json($criteria);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $criteria = RatingCriteria::create($validated);

        return response()->json($criteria, 201);
    }

    public function show(string $id)
    {
        $criteria = RatingCriteria::findOrFail($id);
        return response()->json($criteria);
    }

    public function update(Request $request, string $id)
    {
        $criteria = RatingCriteria::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:500',
            'sort_order' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $criteria->update($validated);

        return response()->json($criteria);
    }

    public function destroy(string $id)
    {
        $criteria = RatingCriteria::findOrFail($id);
        $criteria->delete();

        return response()->json(['message' => 'Rating criteria deleted successfully']);
    }
}
