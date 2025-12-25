<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Ad;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Get all categories ordered by domain_category, then field_category, then item_category, then id
        $categories = Category::orderBy('domain_category')
            ->orderBy('field_category')
            ->orderBy('item_category')
            ->orderBy('id', 'asc')
            ->get();

        // Transform to include 3-level hierarchy info
        $result = [];
        
        foreach ($categories as $category) {
            $result[] = [
                'id' => $category->id,
                'domainCategoryName' => $category->domain_category,
                'fieldCategoryName' => $category->field_category,
                'itemCategoryName' => $category->item_category,
            ];
        }

        return response()->json($result);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'domainCategoryName' => 'required|string|max:255',
            'fieldCategoryName' => 'nullable|string|max:255',
            'itemCategoryName' => 'nullable|string|max:255',
        ]);

        $category = Category::create([
            'domain_category' => $validated['domainCategoryName'],
            'field_category' => $validated['fieldCategoryName'] ?: null,
            'item_category' => $validated['itemCategoryName'] ?: null,
        ]);

        return response()->json($category, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $category = Category::findOrFail($id);
        return response()->json($category);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'domainCategoryName' => 'sometimes|string|max:255',
            'fieldCategoryName' => 'nullable|string|max:255',
            'itemCategoryName' => 'nullable|string|max:255',
        ]);

        // Update domain category name if provided
        if (isset($validated['domainCategoryName'])) {
            $category->domain_category = $validated['domainCategoryName'];
        }

        // Update field category name if provided (can be null)
        if (array_key_exists('fieldCategoryName', $validated)) {
            $category->field_category = $validated['fieldCategoryName'] ?: null;
        }

        // Update item category name if provided (can be null)
        if (array_key_exists('itemCategoryName', $validated)) {
            $category->item_category = $validated['itemCategoryName'] ?: null;
        }

        $category->save();

        return response()->json($category);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $category = Category::findOrFail($id);
        
        // Allow deletion regardless of ads or subcategories
        // When category is deleted, ads' category_id will be set to null (via foreign key constraint)
        // Subcategories can be deleted independently
        
        try {
            $category->delete();
            return response()->json(['message' => 'Category deleted successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete category: ' . $e->getMessage()
            ], 500);
        }
    }
}
