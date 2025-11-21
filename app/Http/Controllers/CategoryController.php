<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
  /**
   * Get all categories with subcategories.
   */
  public function index()
  {
    // Get all unique category names from the category column
    $uniqueCategoryNames = Category::distinct()
      ->orderBy('category')
      ->pluck('category')
      ->unique()
      ->values();

    // For each unique category name, get the main category entry and its subcategories
    $categories = $uniqueCategoryNames->map(function ($categoryName) {
      // Get the main category entry (sub_category is null) or first entry if no main category exists
      $mainCategory = Category::where('category', $categoryName)
        ->whereNull('sub_category')
        ->first();

      // If no main category exists, get the first entry with this category name
      if (!$mainCategory) {
        $mainCategory = Category::where('category', $categoryName)->first();
      }

      // Get all subcategories for this category
      $subcategories = Category::where('category', $categoryName)
        ->whereNotNull('sub_category')
        ->orderBy('sub_category')
        ->get();

      return [
        'id' => $mainCategory ? $mainCategory->id : null,
        'name' => $categoryName,
        'slug' => $categoryName,
        'subcategories' => $subcategories->map(function ($subcategory) {
          return [
            'id' => $subcategory->id,
            'name' => $subcategory->sub_category,
            'slug' => $subcategory->sub_category,
          ];
        }),
      ];
    });

    return response()->json($categories);
  }

  /**
   * Get a single category with its subcategories.
   */
  public function show($slug)
  {
    // Find main category by category name
    $category = Category::where('category', $slug)
      ->whereNull('sub_category')
      ->firstOrFail();

    // Get all subcategories for this category
    $subcategories = Category::where('category', $category->category)
      ->whereNotNull('sub_category')
      ->orderBy('sub_category')
      ->get();

    return response()->json([
      'id' => $category->id,
      'name' => $category->category,
      'slug' => $category->category,
      'subcategories' => $subcategories->map(function ($subcategory) {
        return [
          'id' => $subcategory->id,
          'name' => $subcategory->sub_category,
          'slug' => $subcategory->sub_category,
        ];
      }),
    ]);
  }
}
