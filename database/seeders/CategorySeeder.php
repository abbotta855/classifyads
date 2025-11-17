<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    $categories = [
      [
        'name' => 'Books & Magazines',
        'description' => 'Find books, magazines, and reading materials',
        'subcategories' => [
          'E-books',
          'Fiction',
          'Non-Fiction',
          'Textbooks',
          'Comics & Graphic Novels',
        ],
      ],
      [
        'name' => 'Electronics',
        'description' => 'Electronics, gadgets, and tech devices',
        'subcategories' => [
          'Computers & Laptops',
          'Mobile Phones',
          'Tablets',
          'Cameras',
          'Audio Equipment',
        ],
      ],
      [
        'name' => 'Vehicles',
        'description' => 'Cars, motorcycles, and other vehicles',
        'subcategories' => [
          'Cars',
          'Motorcycles',
          'Trucks',
          'Boats',
          'RVs & Campers',
        ],
      ],
      [
        'name' => 'Furniture',
        'description' => 'Home and office furniture',
        'subcategories' => [
          'Living Room',
          'Bedroom',
          'Kitchen & Dining',
          'Office Furniture',
          'Outdoor Furniture',
        ],
      ],
      [
        'name' => 'Clothing & Accessories',
        'description' => 'Fashion items and accessories',
        'subcategories' => [
          'Men\'s Clothing',
          'Women\'s Clothing',
          'Shoes',
          'Jewelry',
          'Watches',
        ],
      ],
    ];

    foreach ($categories as $categoryData) {
      $category = Category::create([
        'name' => $categoryData['name'],
        'slug' => Str::slug($categoryData['name']),
        'description' => $categoryData['description'],
        'is_active' => true,
        'sort_order' => 0,
      ]);

      foreach ($categoryData['subcategories'] as $subcategoryName) {
        Subcategory::create([
          'category_id' => $category->id,
          'name' => $subcategoryName,
          'slug' => Str::slug($subcategoryName),
          'is_active' => true,
          'sort_order' => 0,
        ]);
      }
    }
  }
}
