<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\NepaliAutoTranslationService;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    private function isNepaliRequest(Request $request): bool
    {
        $lang = strtolower((string) ($request->header('X-Language') ?? $request->query('lang', 'en')));
        return str_starts_with($lang, 'ne');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $isNepali = $this->isNepaliRequest($request);

        // Get all categories ordered by domain_category, then field_category, then item_category, then id
        $categories = Category::orderBy('domain_category')
            ->orderBy('field_category')
            ->orderBy('item_category')
            ->orderBy('id', 'asc')
            ->get();

        // Transform to include 3-level hierarchy info
        $result = [];
        
        foreach ($categories as $category) {
            $domain = $isNepali ? ($category->domain_category_ne ?: $category->domain_category) : $category->domain_category;
            $field = $isNepali ? ($category->field_category_ne ?: $category->field_category) : $category->field_category;
            $item = $isNepali ? ($category->item_category_ne ?: $category->item_category) : $category->item_category;

            $result[] = [
                'id' => $category->id,
                'domainCategoryName' => $domain,
                'fieldCategoryName' => $field,
                'itemCategoryName' => $item,
            ];
        }

        return response()->json($result);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $translator = app(NepaliAutoTranslationService::class);
        $validated = $request->validate([
            'domainCategoryName' => 'required|string|max:255',
            'fieldCategoryName' => 'nullable|string|max:255',
            'itemCategoryName' => 'nullable|string|max:255',
        ]);

        $category = Category::create([
            'domain_category' => $validated['domainCategoryName'],
            'domain_category_ne' => $translator->translateToNepali($validated['domainCategoryName']),
            'field_category' => $validated['fieldCategoryName'] ?: null,
            'field_category_ne' => $translator->translateToNepali($validated['fieldCategoryName'] ?? null),
            'item_category' => $validated['itemCategoryName'] ?: null,
            'item_category_ne' => $translator->translateToNepali($validated['itemCategoryName'] ?? null),
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
        $translator = app(NepaliAutoTranslationService::class);
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'domainCategoryName' => 'sometimes|string|max:255',
            'fieldCategoryName' => 'nullable|string|max:255',
            'itemCategoryName' => 'nullable|string|max:255',
        ]);

        // Update domain category name if provided
        if (isset($validated['domainCategoryName'])) {
            $category->domain_category = $validated['domainCategoryName'];
            $category->domain_category_ne = $translator->translateToNepali($validated['domainCategoryName']);
        }

        // Update field category name if provided (can be null)
        if (array_key_exists('fieldCategoryName', $validated)) {
            $category->field_category = $validated['fieldCategoryName'] ?: null;
            $category->field_category_ne = $translator->translateToNepali($validated['fieldCategoryName'] ?? null);
        }

        // Update item category name if provided (can be null)
        if (array_key_exists('itemCategoryName', $validated)) {
            $category->item_category = $validated['itemCategoryName'] ?: null;
            $category->item_category_ne = $translator->translateToNepali($validated['itemCategoryName'] ?? null);
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
