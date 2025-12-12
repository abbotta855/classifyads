<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    // Clear existing categories first (optional - comment out if you want to keep existing data)
    // Category::truncate();

    $categories = [
      [
        'category' => 'Art & Craft',
        'subcategories' => [
          'Digital art',
          'Drawing',
          'Embroidery',
          'Fabric',
          'Glass art',
          'Leather crafts',
          'Nepali ceramic',
          'Nepali garment',
          'Painting',
          'Sculpture',
        ],
      ],
      [
        'category' => 'Bicycle & Accessories',
        'subcategories' => [
          'Mountain Bikes',
          'Road Bikes',
          'Electric Bikes',
          'Bike Parts',
          'Bicycle Accessories',
          'Cycling Gear',
        ],
      ],
      [
        'category' => 'Books & Magazine',
        'subcategories' => [
          'Fiction',
          'Non-Fiction',
          'Textbooks',
          'Comics',
          'Magazines',
          'E-books',
          'Academic Books',
        ],
      ],
      [
        'category' => 'Building & Construction',
        'subcategories' => [
          'Construction Materials',
          'Tools',
          'Hardware',
          'Plumbing',
          'Electrical Supplies',
          'Cement & Concrete',
        ],
      ],
      [
        'category' => 'Business for Sale',
        'subcategories' => [
          'Retail Business',
          'Restaurant',
          'Service Business',
          'Manufacturing',
          'Online Business',
          'Franchise',
        ],
      ],
      [
        'category' => 'Clothes & Fashion',
        'subcategories' => [
          'Men\'s Clothing',
          'Women\'s Clothing',
          'Kids Clothing',
          'Shoes',
          'Fashion Accessories',
          'Traditional Wear',
        ],
      ],
      [
        'category' => 'Events/Tickets',
        'subcategories' => [
          'Concert Tickets',
          'Sports Tickets',
          'Theater Tickets',
          'Event Planning',
          'Wedding Services',
        ],
      ],
      [
        'category' => 'Farming & Agriculture',
        'subcategories' => [
          'Seeds',
          'Fertilizers',
          'Farm Equipment',
          'Livestock',
          'Crops',
          'Agricultural Tools',
        ],
      ],
      [
        'category' => 'Furniture',
        'subcategories' => [
          'Living Room',
          'Bedroom',
          'Kitchen & Dining',
          'Office Furniture',
          'Outdoor Furniture',
          'Antique Furniture',
        ],
      ],
      [
        'category' => 'Health & Beauty',
        'subcategories' => [
          'Skincare',
          'Makeup',
          'Hair Care',
          'Fitness Equipment',
          'Supplements',
          'Beauty Services',
        ],
      ],
      [
        'category' => 'Home & Garden',
        'subcategories' => [
          'Garden Tools',
          'Plants',
          'Home Decor',
          'Kitchenware',
          'Cleaning Supplies',
          'Lighting',
        ],
      ],
      [
        'category' => 'IT & Computers',
        'subcategories' => [
          'Laptops',
          'Desktops',
          'Computer Parts',
          'Software',
          'Networking Equipment',
          'Gaming Equipment',
        ],
      ],
      [
        'category' => 'Jewelers',
        'subcategories' => [
          'Gold Jewelry',
          'Silver Jewelry',
          'Diamond Jewelry',
          'Watches',
          'Gemstones',
          'Traditional Jewelry',
        ],
      ],
      [
        'category' => 'Jobs',
        'subcategories' => [
          'Full-time',
          'Part-time',
          'Contract',
          'Freelance',
          'Internship',
          'Remote Jobs',
        ],
      ],
      [
        'category' => 'Mobile phone & Gadgets',
        'subcategories' => [
          'Smartphones',
          'Tablets',
          'Mobile Accessories',
          'Wearables',
          'Cases & Covers',
          'Chargers & Cables',
        ],
      ],
      [
        'category' => 'Music & Musical instrument',
        'subcategories' => [
          'Guitars',
          'Pianos',
          'Drums',
          'Wind Instruments',
          'Audio Equipment',
          'Traditional Instruments',
        ],
      ],
      [
        'category' => 'Office Supply',
        'subcategories' => [
          'Stationery',
          'Office Furniture',
          'Printers',
          'Office Equipment',
          'Supplies',
          'Filing Systems',
        ],
      ],
      [
        'category' => 'Pets & Animal',
        'subcategories' => [
          'Dogs',
          'Cats',
          'Birds',
          'Pet Supplies',
          'Pet Food',
          'Pet Services',
        ],
      ],
      [
        'category' => 'Photography',
        'subcategories' => [
          'Cameras',
          'Lenses',
          'Accessories',
          'Photo Equipment',
          'Studio Equipment',
          'Photography Services',
        ],
      ],
      [
        'category' => 'Property',
        'subcategories' => [
          'Land for Sale',
          'House for Sale',
          'Apartments',
          'Commercial Property',
          'Rentals',
          'Land for Rent',
        ],
      ],
      [
        'category' => 'Sports & Recreation',
        'subcategories' => [
          'Sports Equipment',
          'Fitness Gear',
          'Outdoor Gear',
          'Sports Apparel',
          'Games',
          'Camping Equipment',
        ],
      ],
      [
        'category' => 'Travel & Tourism',
        'subcategories' => [
          'Travel Packages',
          'Hotel Bookings',
          'Travel Guides',
          'Travel Accessories',
          'Tour Services',
        ],
      ],
      [
        'category' => 'Vehicle',
        'subcategories' => [
          'Cars',
          'Motorcycles',
          'Trucks',
          'Buses',
          'Boats',
          'RVs',
        ],
      ],
    ];

    foreach ($categories as $categoryData) {
      // Check if main category already exists
      $mainCategory = Category::where('category', $categoryData['category'])
        ->whereNull('sub_category')
        ->first();

      // Create main category if it doesn't exist
      if (!$mainCategory) {
        Category::create([
          'category' => $categoryData['category'],
          'sub_category' => null,
        ]);
      }

      // Create subcategories
      foreach ($categoryData['subcategories'] as $subcategoryName) {
        // Check if subcategory already exists for this specific category
        $existingSubcategory = Category::where('category', $categoryData['category'])
          ->where('sub_category', $subcategoryName)
          ->first();

        // Also check if this subcategory name already exists globally (due to unique constraint)
        $globalSubcategory = Category::where('sub_category', $subcategoryName)->first();

        if (!$existingSubcategory && !$globalSubcategory) {
          Category::create([
            'category' => $categoryData['category'],
            'sub_category' => $subcategoryName,
          ]);
        }
      }
    }
  }
}
