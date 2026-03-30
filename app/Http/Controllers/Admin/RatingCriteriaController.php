<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RatingCriteria;
use Illuminate\Http\Request;

class RatingCriteriaController extends Controller
{
    public function index()
    {
        $query = RatingCriteria::orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc');
        
        // Optional filters to view by context
        if (request()->filled('category_id')) {
            $query->where('category_id', request()->integer('category_id'));
        }
        if (request()->filled('subcategory_id')) {
            $query->where('subcategory_id', request()->integer('subcategory_id'));
        }
        if (request()->filled('active')) {
            $query->where('is_active', request()->boolean('active'));
        }
        $criteria = $query->get();
        
        return response()->json($criteria);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'category_id' => 'nullable|integer|exists:categories,id',
            'subcategory_id' => 'nullable|integer|exists:field_categories,id',
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
            'category_id' => 'nullable|integer|exists:categories,id',
            'subcategory_id' => 'nullable|integer|exists:field_categories,id',
            'sort_order' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $criteria->update($validated);

        return response()->json($criteria);
    }

    /**
     * Quick add 4 default criteria for a given context (category/subcategory/global).
     */
    public function quickAdd(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'nullable|integer|exists:categories,id',
            'subcategory_id' => 'nullable|integer|exists:field_categories,id',
        ]);

        $defaults = [
            ['name' => 'Delivery on Time', 'description' => 'How well the seller delivered the product/service on time'],
            ['name' => 'Value for Money', 'description' => 'Whether the product/service provides good value for the price'],
            ['name' => 'Product Quality', 'description' => 'The quality of the product or service received'],
            ['name' => 'Service Support', 'description' => 'The responsiveness and helpfulness of the service provider'],
        ];

        $created = [];
        $sortOrder = (int) (RatingCriteria::max('sort_order') ?? 0);

        foreach ($defaults as $def) {
            $created[] = RatingCriteria::create([
                'name' => $def['name'],
                'description' => $def['description'],
                'category_id' => $validated['category_id'] ?? null,
                'subcategory_id' => $validated['subcategory_id'] ?? null,
                'sort_order' => ++$sortOrder,
                'is_active' => true,
            ]);
        }

        return response()->json(['created' => $created], 201);
    }

    public function destroy(string $id)
    {
        $criteria = RatingCriteria::findOrFail($id);
        $criteria->delete();

        return response()->json(['message' => 'Rating criteria deleted successfully']);
    }
}
