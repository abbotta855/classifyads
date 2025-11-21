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
    $categories = [
      [
        'category' => 'Art & Craft',
        'subcategories' => [
          'Digital art',
          'Painting',
          'Sculpture',
          'Drawing',
          'Handicrafts',
          'Pottery',
        ],
      ],
      [
        'category' => 'Bicycle & Accessories',
        'subcategories' => [
          'Mountain Bikes',
          'Road Bikes',
          'Electric Bikes',
          'Bike Parts',
          'Bike Accessories',
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
        ],
      ],
      [
        'category' => 'Clothes & Fashion',
        'subcategories' => [
          'Men\'s Clothing',
          'Women\'s Clothing',
          'Kids Clothing',
          'Shoes',
          'Accessories',
        ],
      ],
      [
        'category' => 'Events/Tickets',
        'subcategories' => [
          'Concert Tickets',
          'Sports Tickets',
          'Theater Tickets',
          'Event Planning',
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
        ],
      ],
      [
        'category' => 'Mobile phone & Gadgets',
        'subcategories' => [
          'Smartphones',
          'Tablets',
          'Accessories',
          'Wearables',
          'Cases & Covers',
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
        ],
      ],
      [
        'category' => 'Travel & Tourism',
        'subcategories' => [
          'Travel Packages',
          'Hotel Bookings',
          'Travel Guides',
          'Travel Accessories',
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
      // Create main category (sub_category is null)
      Category::create([
        'category' => $categoryData['category'],
        'sub_category' => null,
      ]);

      // Create subcategories
      foreach ($categoryData['subcategories'] as $subcategoryName) {
        Category::create([
          'category' => $categoryData['category'],
          'sub_category' => $subcategoryName,
        ]);
      }
    }
  }
}
