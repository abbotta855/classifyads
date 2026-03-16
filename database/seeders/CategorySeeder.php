<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
  /**
   * Run the database seeds.
   * Each row is a complete path: domain_category → field_category → item_category
   * Similar to Location table structure where each row is a complete path
   */
  public function run(): void
  {
    // Clear existing categories first
    Category::truncate();

    // Mock data - each row is a complete path (like Location table)
    $categories = [
      // Art & Craft
      ['domain_category' => 'Art & Craft', 'field_category' => 'Digital Art', 'item_category' => 'Digital Painting'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Digital Art', 'item_category' => '3D Art'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Digital Art', 'item_category' => 'Vector Graphics'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Digital Art', 'item_category' => 'Photo Manipulation'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Traditional Art', 'item_category' => 'Drawing'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Traditional Art', 'item_category' => 'Painting'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Traditional Art', 'item_category' => 'Sculpture'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Traditional Art', 'item_category' => 'Sketching'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Crafts', 'item_category' => 'Embroidery'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Crafts', 'item_category' => 'Fabric Crafts'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Crafts', 'item_category' => 'Glass Art'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Crafts', 'item_category' => 'Leather Crafts'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Crafts', 'item_category' => 'Nepali Ceramic'],
      ['domain_category' => 'Art & Craft', 'field_category' => 'Crafts', 'item_category' => 'Nepali Garment'],

      // Bicycle & Accessories
      ['domain_category' => 'Bicycle & Accessories', 'field_category' => 'Bicycles', 'item_category' => 'Mountain Bikes'],
      ['domain_category' => 'Bicycle & Accessories', 'field_category' => 'Bicycles', 'item_category' => 'Road Bikes'],
      ['domain_category' => 'Bicycle & Accessories', 'field_category' => 'Bicycles', 'item_category' => 'Electric Bikes'],
      ['domain_category' => 'Bicycle & Accessories', 'field_category' => 'Bicycles', 'item_category' => 'Hybrid Bikes'],
      ['domain_category' => 'Bicycle & Accessories', 'field_category' => 'Parts', 'item_category' => 'Bike Parts'],
      ['domain_category' => 'Bicycle & Accessories', 'field_category' => 'Parts', 'item_category' => 'Bicycle Accessories'],
      ['domain_category' => 'Bicycle & Accessories', 'field_category' => 'Parts', 'item_category' => 'Cycling Gear'],

      // Books & Magazine
      ['domain_category' => 'Books & Magazine', 'field_category' => 'Books', 'item_category' => 'Fiction'],
      ['domain_category' => 'Books & Magazine', 'field_category' => 'Books', 'item_category' => 'Non-Fiction'],
      ['domain_category' => 'Books & Magazine', 'field_category' => 'Books', 'item_category' => 'Textbooks'],
      ['domain_category' => 'Books & Magazine', 'field_category' => 'Books', 'item_category' => 'Comics'],
      ['domain_category' => 'Books & Magazine', 'field_category' => 'Books', 'item_category' => 'Academic Books'],
      ['domain_category' => 'Books & Magazine', 'field_category' => 'Media', 'item_category' => 'Magazines'],
      ['domain_category' => 'Books & Magazine', 'field_category' => 'Media', 'item_category' => 'E-books'],

      // Building & Construction
      ['domain_category' => 'Building & Construction', 'field_category' => 'Materials', 'item_category' => 'Construction Materials'],
      ['domain_category' => 'Building & Construction', 'field_category' => 'Materials', 'item_category' => 'Cement & Concrete'],
      ['domain_category' => 'Building & Construction', 'field_category' => 'Materials', 'item_category' => 'Steel & Metal'],
      ['domain_category' => 'Building & Construction', 'field_category' => 'Tools', 'item_category' => 'Power Tools'],
      ['domain_category' => 'Building & Construction', 'field_category' => 'Tools', 'item_category' => 'Hand Tools'],
      ['domain_category' => 'Building & Construction', 'field_category' => 'Hardware', 'item_category' => 'Plumbing'],
      ['domain_category' => 'Building & Construction', 'field_category' => 'Hardware', 'item_category' => 'Electrical Supplies'],

      // Business for Sale
      ['domain_category' => 'Business for Sale', 'field_category' => 'Retail', 'item_category' => 'Retail Business'],
      ['domain_category' => 'Business for Sale', 'field_category' => 'Retail', 'item_category' => 'Franchise'],
      ['domain_category' => 'Business for Sale', 'field_category' => 'Service', 'item_category' => 'Restaurant'],
      ['domain_category' => 'Business for Sale', 'field_category' => 'Service', 'item_category' => 'Service Business'],
      ['domain_category' => 'Business for Sale', 'field_category' => 'Industrial', 'item_category' => 'Manufacturing'],
      ['domain_category' => 'Business for Sale', 'field_category' => 'Digital', 'item_category' => 'Online Business'],

      // Clothes & Fashion
      ['domain_category' => 'Clothes & Fashion', 'field_category' => 'Clothing', 'item_category' => 'Men\'s Clothing'],
      ['domain_category' => 'Clothes & Fashion', 'field_category' => 'Clothing', 'item_category' => 'Women\'s Clothing'],
      ['domain_category' => 'Clothes & Fashion', 'field_category' => 'Clothing', 'item_category' => 'Kids Clothing'],
      ['domain_category' => 'Clothes & Fashion', 'field_category' => 'Clothing', 'item_category' => 'Traditional Wear'],
      ['domain_category' => 'Clothes & Fashion', 'field_category' => 'Accessories', 'item_category' => 'Shoes'],
      ['domain_category' => 'Clothes & Fashion', 'field_category' => 'Accessories', 'item_category' => 'Fashion Accessories'],
      ['domain_category' => 'Clothes & Fashion', 'field_category' => 'Accessories', 'item_category' => 'Bags'],

      // Events/Tickets
      ['domain_category' => 'Events/Tickets', 'field_category' => 'Tickets', 'item_category' => 'Concert Tickets'],
      ['domain_category' => 'Events/Tickets', 'field_category' => 'Tickets', 'item_category' => 'Sports Tickets'],
      ['domain_category' => 'Events/Tickets', 'field_category' => 'Tickets', 'item_category' => 'Theater Tickets'],
      ['domain_category' => 'Events/Tickets', 'field_category' => 'Services', 'item_category' => 'Event Planning'],
      ['domain_category' => 'Events/Tickets', 'field_category' => 'Services', 'item_category' => 'Wedding Services'],

      // Farming & Agriculture
      ['domain_category' => 'Farming & Agriculture', 'field_category' => 'Supplies', 'item_category' => 'Seeds'],
      ['domain_category' => 'Farming & Agriculture', 'field_category' => 'Supplies', 'item_category' => 'Fertilizers'],
      ['domain_category' => 'Farming & Agriculture', 'field_category' => 'Supplies', 'item_category' => 'Agricultural Tools'],
      ['domain_category' => 'Farming & Agriculture', 'field_category' => 'Equipment', 'item_category' => 'Farm Equipment'],
      ['domain_category' => 'Farming & Agriculture', 'field_category' => 'Livestock', 'item_category' => 'Livestock'],
      ['domain_category' => 'Farming & Agriculture', 'field_category' => 'Livestock', 'item_category' => 'Crops'],

      // Furniture
      ['domain_category' => 'Furniture', 'field_category' => 'Indoor', 'item_category' => 'Living Room'],
      ['domain_category' => 'Furniture', 'field_category' => 'Indoor', 'item_category' => 'Bedroom'],
      ['domain_category' => 'Furniture', 'field_category' => 'Indoor', 'item_category' => 'Kitchen & Dining'],
      ['domain_category' => 'Furniture', 'field_category' => 'Indoor', 'item_category' => 'Office Furniture'],
      ['domain_category' => 'Furniture', 'field_category' => 'Outdoor', 'item_category' => 'Outdoor Furniture'],
      ['domain_category' => 'Furniture', 'field_category' => 'Vintage', 'item_category' => 'Antique Furniture'],

      // Health & Beauty
      ['domain_category' => 'Health & Beauty', 'field_category' => 'Beauty', 'item_category' => 'Skincare'],
      ['domain_category' => 'Health & Beauty', 'field_category' => 'Beauty', 'item_category' => 'Makeup'],
      ['domain_category' => 'Health & Beauty', 'field_category' => 'Beauty', 'item_category' => 'Hair Care'],
      ['domain_category' => 'Health & Beauty', 'field_category' => 'Beauty', 'item_category' => 'Beauty Services'],
      ['domain_category' => 'Health & Beauty', 'field_category' => 'Fitness', 'item_category' => 'Fitness Equipment'],
      ['domain_category' => 'Health & Beauty', 'field_category' => 'Fitness', 'item_category' => 'Supplements'],

      // Home & Garden
      ['domain_category' => 'Home & Garden', 'field_category' => 'Garden', 'item_category' => 'Garden Tools'],
      ['domain_category' => 'Home & Garden', 'field_category' => 'Garden', 'item_category' => 'Plants'],
      ['domain_category' => 'Home & Garden', 'field_category' => 'Garden', 'item_category' => 'Garden Decor'],
      ['domain_category' => 'Home & Garden', 'field_category' => 'Home', 'item_category' => 'Home Decor'],
      ['domain_category' => 'Home & Garden', 'field_category' => 'Home', 'item_category' => 'Kitchenware'],
      ['domain_category' => 'Home & Garden', 'field_category' => 'Home', 'item_category' => 'Cleaning Supplies'],
      ['domain_category' => 'Home & Garden', 'field_category' => 'Home', 'item_category' => 'Lighting'],

      // IT & Computers
      ['domain_category' => 'IT & Computers', 'field_category' => 'Computers', 'item_category' => 'Laptops'],
      ['domain_category' => 'IT & Computers', 'field_category' => 'Computers', 'item_category' => 'Desktops'],
      ['domain_category' => 'IT & Computers', 'field_category' => 'Computers', 'item_category' => 'Computer Parts'],
      ['domain_category' => 'IT & Computers', 'field_category' => 'Computers', 'item_category' => 'Gaming Equipment'],
      ['domain_category' => 'IT & Computers', 'field_category' => 'Software', 'item_category' => 'Software'],
      ['domain_category' => 'IT & Computers', 'field_category' => 'Networking', 'item_category' => 'Networking Equipment'],

      // Jewelers
      ['domain_category' => 'Jewelers', 'field_category' => 'Jewelry', 'item_category' => 'Gold Jewelry'],
      ['domain_category' => 'Jewelers', 'field_category' => 'Jewelry', 'item_category' => 'Silver Jewelry'],
      ['domain_category' => 'Jewelers', 'field_category' => 'Jewelry', 'item_category' => 'Diamond Jewelry'],
      ['domain_category' => 'Jewelers', 'field_category' => 'Jewelry', 'item_category' => 'Traditional Jewelry'],
      ['domain_category' => 'Jewelers', 'field_category' => 'Timepieces', 'item_category' => 'Watches'],
      ['domain_category' => 'Jewelers', 'field_category' => 'Gems', 'item_category' => 'Gemstones'],

      // Jobs
      ['domain_category' => 'Jobs', 'field_category' => 'Employment Type', 'item_category' => 'Full-time'],
      ['domain_category' => 'Jobs', 'field_category' => 'Employment Type', 'item_category' => 'Part-time'],
      ['domain_category' => 'Jobs', 'field_category' => 'Employment Type', 'item_category' => 'Contract'],
      ['domain_category' => 'Jobs', 'field_category' => 'Employment Type', 'item_category' => 'Freelance'],
      ['domain_category' => 'Jobs', 'field_category' => 'Employment Type', 'item_category' => 'Internship'],
      ['domain_category' => 'Jobs', 'field_category' => 'Employment Type', 'item_category' => 'Remote Jobs'],

      // Mobile phone & Gadgets
      ['domain_category' => 'Mobile phone & Gadgets', 'field_category' => 'Devices', 'item_category' => 'Smartphones'],
      ['domain_category' => 'Mobile phone & Gadgets', 'field_category' => 'Devices', 'item_category' => 'Tablets'],
      ['domain_category' => 'Mobile phone & Gadgets', 'field_category' => 'Devices', 'item_category' => 'Wearables'],
      ['domain_category' => 'Mobile phone & Gadgets', 'field_category' => 'Accessories', 'item_category' => 'Mobile Accessories'],
      ['domain_category' => 'Mobile phone & Gadgets', 'field_category' => 'Accessories', 'item_category' => 'Cases & Covers'],
      ['domain_category' => 'Mobile phone & Gadgets', 'field_category' => 'Accessories', 'item_category' => 'Chargers & Cables'],

      // Music & Musical instrument
      ['domain_category' => 'Music & Musical instrument', 'field_category' => 'Instruments', 'item_category' => 'Guitars'],
      ['domain_category' => 'Music & Musical instrument', 'field_category' => 'Instruments', 'item_category' => 'Pianos'],
      ['domain_category' => 'Music & Musical instrument', 'field_category' => 'Instruments', 'item_category' => 'Drums'],
      ['domain_category' => 'Music & Musical instrument', 'field_category' => 'Instruments', 'item_category' => 'Wind Instruments'],
      ['domain_category' => 'Music & Musical instrument', 'field_category' => 'Instruments', 'item_category' => 'Traditional Instruments'],
      ['domain_category' => 'Music & Musical instrument', 'field_category' => 'Equipment', 'item_category' => 'Audio Equipment'],

      // Office Supply
      ['domain_category' => 'Office Supply', 'field_category' => 'Stationery', 'item_category' => 'Stationery'],
      ['domain_category' => 'Office Supply', 'field_category' => 'Stationery', 'item_category' => 'Supplies'],
      ['domain_category' => 'Office Supply', 'field_category' => 'Furniture', 'item_category' => 'Office Furniture'],
      ['domain_category' => 'Office Supply', 'field_category' => 'Equipment', 'item_category' => 'Printers'],
      ['domain_category' => 'Office Supply', 'field_category' => 'Equipment', 'item_category' => 'Office Equipment'],
      ['domain_category' => 'Office Supply', 'field_category' => 'Organization', 'item_category' => 'Filing Systems'],

      // Pets & Animal
      ['domain_category' => 'Pets & Animal', 'field_category' => 'Pets', 'item_category' => 'Dogs'],
      ['domain_category' => 'Pets & Animal', 'field_category' => 'Pets', 'item_category' => 'Cats'],
      ['domain_category' => 'Pets & Animal', 'field_category' => 'Pets', 'item_category' => 'Birds'],
      ['domain_category' => 'Pets & Animal', 'field_category' => 'Supplies', 'item_category' => 'Pet Supplies'],
      ['domain_category' => 'Pets & Animal', 'field_category' => 'Supplies', 'item_category' => 'Pet Food'],
      ['domain_category' => 'Pets & Animal', 'field_category' => 'Services', 'item_category' => 'Pet Services'],

      // Photography
      ['domain_category' => 'Photography', 'field_category' => 'Equipment', 'item_category' => 'Cameras'],
      ['domain_category' => 'Photography', 'field_category' => 'Equipment', 'item_category' => 'Lenses'],
      ['domain_category' => 'Photography', 'field_category' => 'Equipment', 'item_category' => 'Accessories'],
      ['domain_category' => 'Photography', 'field_category' => 'Equipment', 'item_category' => 'Photo Equipment'],
      ['domain_category' => 'Photography', 'field_category' => 'Studio', 'item_category' => 'Studio Equipment'],
      ['domain_category' => 'Photography', 'field_category' => 'Services', 'item_category' => 'Photography Services'],

      // Property
      ['domain_category' => 'Property', 'field_category' => 'For Sale', 'item_category' => 'Land for Sale'],
      ['domain_category' => 'Property', 'field_category' => 'For Sale', 'item_category' => 'House for Sale'],
      ['domain_category' => 'Property', 'field_category' => 'For Sale', 'item_category' => 'Apartments'],
      ['domain_category' => 'Property', 'field_category' => 'For Sale', 'item_category' => 'Commercial Property'],
      ['domain_category' => 'Property', 'field_category' => 'For Rent', 'item_category' => 'Rentals'],
      ['domain_category' => 'Property', 'field_category' => 'For Rent', 'item_category' => 'Land for Rent'],

      // Sports & Recreation
      ['domain_category' => 'Sports & Recreation', 'field_category' => 'Equipment', 'item_category' => 'Sports Equipment'],
      ['domain_category' => 'Sports & Recreation', 'field_category' => 'Equipment', 'item_category' => 'Fitness Gear'],
      ['domain_category' => 'Sports & Recreation', 'field_category' => 'Equipment', 'item_category' => 'Outdoor Gear'],
      ['domain_category' => 'Sports & Recreation', 'field_category' => 'Equipment', 'item_category' => 'Camping Equipment'],
      ['domain_category' => 'Sports & Recreation', 'field_category' => 'Apparel', 'item_category' => 'Sports Apparel'],
      ['domain_category' => 'Sports & Recreation', 'field_category' => 'Games', 'item_category' => 'Games'],

      // Travel & Tourism
      ['domain_category' => 'Travel & Tourism', 'field_category' => 'Services', 'item_category' => 'Travel Packages'],
      ['domain_category' => 'Travel & Tourism', 'field_category' => 'Services', 'item_category' => 'Hotel Bookings'],
      ['domain_category' => 'Travel & Tourism', 'field_category' => 'Services', 'item_category' => 'Tour Services'],
      ['domain_category' => 'Travel & Tourism', 'field_category' => 'Guides', 'item_category' => 'Travel Guides'],
      ['domain_category' => 'Travel & Tourism', 'field_category' => 'Accessories', 'item_category' => 'Travel Accessories'],

      // Vehicle
      ['domain_category' => 'Vehicle', 'field_category' => 'Cars', 'item_category' => 'Cars'],
      ['domain_category' => 'Vehicle', 'field_category' => 'Motorcycles', 'item_category' => 'Motorcycles'],
      ['domain_category' => 'Vehicle', 'field_category' => 'Commercial', 'item_category' => 'Trucks'],
      ['domain_category' => 'Vehicle', 'field_category' => 'Commercial', 'item_category' => 'Buses'],
      ['domain_category' => 'Vehicle', 'field_category' => 'Water', 'item_category' => 'Boats'],
      ['domain_category' => 'Vehicle', 'field_category' => 'Recreational', 'item_category' => 'RVs'],
    ];

    // Create categories - each row is a complete path (like Location table)
    foreach ($categories as $categoryData) {
      Category::create([
        'domain_category' => $categoryData['domain_category'],
        'field_category' => $categoryData['field_category'],
        'item_category' => $categoryData['item_category'],
      ]);
    }
  }
}
