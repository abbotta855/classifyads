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
    // Get all main categories (sub_category is null)
    $mainCategories = Category::whereNull('sub_category')
      ->orderBy('category')
      ->get();

    // Format response
    $categories = $mainCategories->map(function ($category) {
      // Get all subcategories for this category
      $subcategories = Category::where('category', $category->category)
        ->whereNotNull('sub_category')
        ->orderBy('sub_category')
        ->get();

      return [
        'id' => $category->id,
        'name' => $category->category,
        'slug' => $category->category, // Use category name as slug for main categories
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
