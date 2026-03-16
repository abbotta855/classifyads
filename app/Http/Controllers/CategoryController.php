<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
  /**
   * Get all categories in hierarchical format (Domain Category → Field Category → Item Category)
   * Similar to LocationController - builds hierarchy from complete paths
   */
  public function index()
  {
    // Get all categories from database (each row is a complete path)
    $categories = Category::orderBy('domain_category')
      ->orderBy('field_category')
      ->orderBy('item_category')
      ->get();

    // Build hierarchical structure (like LocationController)
    $domainCategories = [];
    $domainMap = [];
    $fieldMap = [];

    foreach ($categories as $category) {
      $domainCategoryName = $category->domain_category;
      $fieldCategoryName = $category->field_category;
      $itemCategoryName = $category->item_category;

      // Create domain category if it doesn't exist
      if (!isset($domainMap[$domainCategoryName])) {
        $domainId = count($domainCategories) + 1;
        $domainMap[$domainCategoryName] = $domainId;
        $domainCategories[] = [
          'id' => $domainId,
          'name' => $domainCategoryName,
          'domain_category' => $domainCategoryName,
          'slug' => $domainCategoryName,
          'field_categories' => [],
          'item_categories' => []
        ];
      }

      $domainIndex = $domainMap[$domainCategoryName] - 1;
      $domainCategory = &$domainCategories[$domainIndex];

      // If field_category exists, create field category if it doesn't exist
      if ($fieldCategoryName) {
        $fieldKey = $domainCategoryName . '|' . $fieldCategoryName;
        if (!isset($fieldMap[$fieldKey])) {
          $fieldId = count($domainCategory['field_categories']) + 1;
          $fieldMap[$fieldKey] = $fieldId;
          $domainCategory['field_categories'][] = [
            'id' => $fieldId,
            'name' => $fieldCategoryName,
            'field_category' => $fieldCategoryName,
            'slug' => $fieldCategoryName,
            'item_categories' => []
          ];
        }

        $fieldIndex = $fieldMap[$fieldKey] - 1;
        $fieldCategory = &$domainCategory['field_categories'][$fieldIndex];

        // If item_category exists, add it to the field category
        if ($itemCategoryName) {
          // Check if item category already exists
          $itemExists = false;
          foreach ($fieldCategory['item_categories'] as $existingItem) {
            if ($existingItem['name'] === $itemCategoryName) {
              $itemExists = true;
              break;
            }
          }

          if (!$itemExists) {
            $fieldCategory['item_categories'][] = [
              'id' => $category->id, // Use the actual database ID
              'name' => $itemCategoryName,
              'item_category' => $itemCategoryName,
              'slug' => $itemCategoryName,
            ];
          }
        }
      } else {
        // If no field_category but has item_category, add directly to domain
        if ($itemCategoryName) {
          $itemExists = false;
          foreach ($domainCategory['item_categories'] as $existingItem) {
            if ($existingItem['name'] === $itemCategoryName) {
              $itemExists = true;
              break;
            }
          }

          if (!$itemExists) {
            $domainCategory['item_categories'][] = [
              'id' => $category->id, // Use the actual database ID
              'name' => $itemCategoryName,
              'item_category' => $itemCategoryName,
              'slug' => $itemCategoryName,
            ];
          }
        }
      }
    }

    // Set domain category IDs to the first category ID for each domain
    foreach ($domainCategories as &$domainCategory) {
      $firstCategory = Category::where('domain_category', $domainCategory['domain_category'])
        ->orderBy('id')
        ->first();
      $domainCategory['id'] = $firstCategory ? $firstCategory->id : null;
    }

    return response()->json($domainCategories);
  }

  /**
   * Get a single domain category with its field and item categories.
   * Similar to LocationController - builds hierarchy from complete paths
   */
  public function show($slug)
  {
    // Get all categories for this domain category
    $categories = Category::where('domain_category', $slug)
      ->orderBy('field_category')
      ->orderBy('item_category')
      ->get();

    if ($categories->isEmpty()) {
      abort(404, 'Category not found');
    }

    $domainCategoryName = $categories->first()->domain_category;
    $fieldCategories = [];
    $fieldMap = [];
    $directItemCategories = [];

    foreach ($categories as $category) {
      $fieldCategoryName = $category->field_category;
      $itemCategoryName = $category->item_category;

      if ($fieldCategoryName) {
        // Has field category
        $fieldKey = $fieldCategoryName;
        if (!isset($fieldMap[$fieldKey])) {
          $fieldId = count($fieldCategories) + 1;
          $fieldMap[$fieldKey] = $fieldId;
          $fieldCategories[] = [
            'id' => $fieldId,
            'name' => $fieldCategoryName,
            'field_category' => $fieldCategoryName,
            'slug' => $fieldCategoryName,
            'item_categories' => []
          ];
        }

        $fieldIndex = $fieldMap[$fieldKey] - 1;
        $fieldCategory = &$fieldCategories[$fieldIndex];

        // If item_category exists, add it to the field category
        if ($itemCategoryName) {
          $itemExists = false;
          foreach ($fieldCategory['item_categories'] as $existingItem) {
            if ($existingItem['name'] === $itemCategoryName) {
              $itemExists = true;
              break;
            }
          }

          if (!$itemExists) {
            $fieldCategory['item_categories'][] = [
              'id' => $category->id,
              'name' => $itemCategoryName,
              'item_category' => $itemCategoryName,
              'slug' => $itemCategoryName,
            ];
          }
        }
      } else {
        // No field category, but has item category - add directly to domain
        if ($itemCategoryName) {
          $itemExists = false;
          foreach ($directItemCategories as $existingItem) {
            if ($existingItem['name'] === $itemCategoryName) {
              $itemExists = true;
              break;
            }
          }

          if (!$itemExists) {
            $directItemCategories[] = [
              'id' => $category->id,
              'name' => $itemCategoryName,
              'item_category' => $itemCategoryName,
              'slug' => $itemCategoryName,
            ];
          }
        }
      }
    }

    $firstCategory = $categories->first();

    return response()->json([
      'id' => $firstCategory->id,
      'name' => $domainCategoryName,
      'domain_category' => $domainCategoryName,
      'slug' => $domainCategoryName,
      'field_categories' => $fieldCategories,
      'item_categories' => $directItemCategories,
    ]);
  }
}
