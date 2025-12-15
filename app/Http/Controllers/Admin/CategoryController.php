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
        // Get all categories ordered by category, then sub_category, then id (newest at bottom of same hierarchy)
        $categories = Category::orderBy('category')
            ->orderBy('sub_category')
            ->orderBy('id', 'asc') // Within same hierarchy, newest at bottom
            ->get();

        // Transform to include category and subcategory info
        $result = [];
        $processedCategories = [];
        
        foreach ($categories as $category) {
            $categoryName = $category->category;
            
            // If this is a main category (sub_category is null), add it as a row
            if ($category->sub_category === null) {
                if (!in_array($categoryName, $processedCategories)) {
                    $result[] = [
                        'id' => $category->id,
                        'categoryId' => $category->id,
                        'categoryName' => $category->category,
                        'subcategoryId' => null,
                        'subcategoryName' => '',
                    ];
                    $processedCategories[] = $categoryName;
                }
            } else {
                // This is a subcategory
                // Find the main category ID for this category name
                $mainCategory = Category::where('category', $categoryName)
                    ->whereNull('sub_category')
                    ->first();
                
                $result[] = [
                    'id' => $category->id,
                    'categoryId' => $mainCategory ? $mainCategory->id : $category->id,
                    'categoryName' => $category->category,
                    'subcategoryId' => $category->id,
                    'subcategoryName' => $category->sub_category,
                ];
            }
        }

        return response()->json($result);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'categoryName' => 'required|string|max:255',
            'subcategoryName' => 'nullable|string|max:255',
        ]);

        if (!empty($validated['subcategoryName'])) {
            // Create subcategory
            $category = Category::create([
                'category' => $validated['categoryName'],
                'sub_category' => $validated['subcategoryName'],
            ]);
        } else {
            // Create main category
            $category = Category::create([
                'category' => $validated['categoryName'],
                'sub_category' => null,
            ]);
        }

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
            'categoryName' => 'sometimes|string|max:255',
            'subcategoryName' => 'nullable|string|max:255',
        ]);

        // Update category name if provided
        if (isset($validated['categoryName'])) {
            $category->category = $validated['categoryName'];
        }

        // Update subcategory name if provided (can be null to convert subcategory to main category)
        if (array_key_exists('subcategoryName', $validated)) {
            $category->sub_category = $validated['subcategoryName'] ?: null;
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
