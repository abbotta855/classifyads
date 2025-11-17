<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UpdateCategoriesSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    // Clear existing categories
    Category::truncate();

    // New major categories in alphabetical order
    $categories = [
      'Art & Craft',
      'Bicycle & Accessories',
      'Books & Magazine',
      'Building & Construction',
      'Business for Sale',
      'Clothes & Fashion',
      'Events/Tickets',
      'Farming & Agriculture',
      'Furniture',
      'Health & Beauty',
      'Home & Garden',
      'IT & Computers',
      'Jewelers',
      'Jobs',
      'Mobile phone & Gadgets',
      'Music & Musical instrument',
      'Office Supply',
      'Pets & Animal',
      'Photography',
      'Property',
      'Sports & Recreation',
      'Travel & Tourism',
      'Vehicle',
    ];

    foreach ($categories as $index => $categoryName) {
      Category::create([
        'name' => $categoryName,
        'slug' => Str::slug($categoryName),
        'parent_id' => null, // Top-level categories
        'description' => null,
        'icon' => null,
        'sort_order' => $index,
        'is_active' => true,
        'total_ads' => 0,
      ]);
    }
  }
}
