<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
  /**
   * Get all active categories with subcategories and ad counts.
   */
  public function index()
  {
    // Get only top-level categories (parent_id is null)
    $categories = Category::where('is_active', true)
      ->whereNull('parent_id')
      ->with(['children' => function ($query) {
        $query->where('is_active', true)->orderBy('name');
      }])
      ->orderBy('name')
      ->get();

    // Format response with ad counts
    $categories = $categories->map(function ($category) {
      return [
        'id' => $category->id,
        'name' => $category->name,
        'slug' => $category->slug,
        'description' => $category->description,
        'icon' => $category->icon,
        'ad_count' => $category->total_ads_count,
        'subcategories' => $category->children->map(function ($subcategory) {
          return [
            'id' => $subcategory->id,
            'name' => $subcategory->name,
            'slug' => $subcategory->slug,
            'description' => $subcategory->description,
            'ad_count' => $subcategory->total_ads_count,
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
    $category = Category::where('slug', $slug)
      ->where('is_active', true)
      ->with(['children' => function ($query) {
        $query->where('is_active', true)->orderBy('name');
      }])
      ->firstOrFail();

    return response()->json([
      'id' => $category->id,
      'name' => $category->name,
      'slug' => $category->slug,
      'description' => $category->description,
      'icon' => $category->icon,
      'ad_count' => $category->total_ads_count,
      'subcategories' => $category->children->map(function ($subcategory) {
        return [
          'id' => $subcategory->id,
          'name' => $subcategory->name,
          'slug' => $subcategory->slug,
          'description' => $subcategory->description,
          'ad_count' => $subcategory->total_ads_count,
        ];
      }),
    ]);
  }
}
