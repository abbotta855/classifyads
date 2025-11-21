<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Get all categories ordered by category, then sub_category
        $categories = Category::orderBy('category')
            ->orderBy('sub_category')
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
        
        // Check if it's a main category with subcategories
        if ($category->sub_category === null) {
            $subcategoriesCount = Category::where('category', $category->category)
                ->whereNotNull('sub_category')
                ->count();
            
            if ($subcategoriesCount > 0) {
                return response()->json([
                    'message' => 'Cannot delete category with subcategories. Please delete subcategories first.'
                ], 422);
            }
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
