<?php

namespace Database\Seeders;

use App\Models\Ad;
use App\Models\Category;
use App\Models\User;
use App\Models\Location;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AdsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all item categories (categories with all three levels: domain, field, item)
        // These are the actual categories that ads should reference
        $itemCategories = Category::whereNotNull('item_category')
            ->whereNotNull('field_category')
            ->whereNotNull('domain_category')
            ->get();
        
        // Get all locations (wards) for assigning to ads
        $locations = Location::whereNotNull('ward_number')->get();
        
        $users = User::all();
        
        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please seed users first.');
            return;
        }
        
        if ($itemCategories->isEmpty()) {
            $this->command->warn('No item categories found. Please seed categories first.');
            return;
        }
        
        if ($locations->isEmpty()) {
            $this->command->warn('No locations found. Please seed locations first.');
            return;
        }
        
        $this->command->info('Generating ads for ' . $itemCategories->count() . ' item categories...');
        
        // Define ad templates by category
        $adTemplates = [
            'Property' => [
                'Beautiful {type} in {location}',
                'Luxury {type} for Sale - {location}',
                'Modern {type} - Prime Location',
                'Spacious {type} in {location}',
                'Affordable {type} - {location}',
                '{type} with Garden - {location}',
                'Premium {type} - {location}',
                'Newly Built {type} - {location}',
            ],
            'Vehicle' => [
                '{brand} {model} {year} - Excellent Condition',
                '{brand} {model} - Well Maintained',
                '{brand} {model} {year} - Low Mileage',
                'Used {brand} {model} - Great Deal',
                '{brand} {model} - Like New',
                '{brand} {model} {year} - Perfect Condition',
                'Premium {brand} {model} - {location}',
                '{brand} {model} - Best Price',
            ],
            'Mobile phone & Gadgets' => [
                '{brand} {model} - {storage}GB - {condition}',
                'Latest {brand} {model} - Unboxed',
                '{brand} {model} - Brand New',
                'Used {brand} {model} - Good Condition',
                '{brand} {model} - {color} - {storage}GB',
                'Premium {brand} {model} - {condition}',
                '{brand} {model} - Latest Model',
                'Refurbished {brand} {model}',
            ],
            'IT & Computers' => [
                '{brand} {model} Laptop - {specs}',
                'Gaming Laptop - {brand} {model}',
                'Business Laptop - {brand} {model}',
                '{brand} Desktop Computer - {specs}',
                'High Performance {brand} {model}',
                '{brand} {model} - {specs} - {condition}',
                'Professional {brand} {model}',
                'Budget Friendly {brand} {model}',
            ],
            'Furniture' => [
                'Modern {type} Set - {material}',
                'Comfortable {type} - {color}',
                'Premium {type} - {location}',
                'Antique {type} - Vintage Style',
                'Contemporary {type} Set',
                '{type} - Perfect for {room}',
                'Luxury {type} - {material}',
                'Affordable {type} - Great Quality',
            ],
            'Clothes & Fashion' => [
                '{type} - {brand} - Size {size}',
                'Designer {type} - {brand}',
                'Vintage {type} - {condition}',
                'Brand New {type} - {brand}',
                'Trendy {type} - {color}',
                'Premium {type} - {brand}',
                '{type} Collection - {brand}',
                'Fashionable {type} - {size}',
            ],
            'Sports & Recreation' => [
                '{type} - Professional Grade',
                'High Quality {type} - {brand}',
                '{type} Equipment - {condition}',
                'Premium {type} - {brand}',
                'Used {type} - Good Condition',
                '{type} Set - Complete Package',
                'Brand New {type} - {brand}',
                'Top Quality {type} Equipment',
            ],
            'Home & Garden' => [
                '{type} - Perfect for Garden',
                'Premium {type} - {material}',
                '{type} Tools Set - Complete',
                'Modern {type} - {location}',
                'High Quality {type} - {brand}',
                '{type} - Great for Home',
                'Professional {type} - {brand}',
                'Affordable {type} - Quality',
            ],
            'Books & Magazine' => [
                '{type} - {author} - {condition}',
                'Collection of {type} Books',
                '{type} - First Edition',
                'Rare {type} - {author}',
                '{type} Set - Complete Series',
                'Educational {type} - {subject}',
                'Vintage {type} - {author}',
                '{type} - Brand New',
            ],
            'Art & Craft' => [
                'Beautiful {type} - {artist}',
                'Handmade {type} - Unique',
                'Vintage {type} - {condition}',
                'Professional {type} - {artist}',
                'Original {type} - {artist}',
                'Premium {type} - {material}',
                'Custom {type} - Handcrafted',
                'Artistic {type} - {artist}',
            ],
            'Music & Musical instrument' => [
                '{type} - {brand} - {condition}',
                'Professional {type} - {brand}',
                'Vintage {type} - {brand}',
                'Acoustic {type} - {brand}',
                'Electric {type} - {brand}',
                '{type} Set - Complete',
                'Premium {type} - {brand}',
                'Classic {type} - {brand}',
            ],
            'Photography' => [
                '{brand} {model} Camera - {condition}',
                'Professional {brand} {model}',
                '{brand} {model} with Lens',
                'DSLR {brand} {model} - {condition}',
                'Mirrorless {brand} {model}',
                '{brand} {model} - Complete Kit',
                'Vintage {brand} {model}',
                'High End {brand} {model}',
            ],
            'Furniture' => [
                'Modern {type} - {material}',
                'Comfortable {type} Set',
                'Premium {type} - {location}',
                '{type} - Perfect for {room}',
                'Luxury {type} - {material}',
                'Contemporary {type}',
                'Antique {type} - Vintage',
                'Affordable {type} - Quality',
            ],
        ];
        
        // Category-specific data
        $categoryData = [
            'Property' => [
                'types' => ['Land', 'House', 'Apartment', 'Villa', 'Flat', 'Condo', 'Building'],
                'locations' => ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Chitwan', 'Butwal', 'Dharan'],
            ],
            'Vehicle' => [
                'brands' => ['Toyota', 'Honda', 'Suzuki', 'Yamaha', 'Bajaj', 'TVS', 'Hero', 'Mahindra', 'Tata', 'Isuzu', 'Nissan', 'Hyundai'],
                'models' => ['Corolla', 'Civic', 'City', 'Swift', 'Alto', 'FZ', 'CB', 'Pulsar', 'Apache', 'Splendor', 'XUV', 'Nexon', 'D-Max', 'Sunny', 'i20'],
                'years' => [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
            ],
            'Mobile phone & Gadgets' => [
                'brands' => ['iPhone', 'Samsung', 'Xiaomi', 'OnePlus', 'Oppo', 'Vivo', 'Realme', 'Huawei'],
                'models' => ['15 Pro', '14', '13', 'Galaxy S24', 'Galaxy A54', 'Note 20', 'Redmi Note 12', 'OnePlus 11', 'Reno 10', 'V25', 'GT 5', 'P50'],
                'storages' => [64, 128, 256, 512],
                'colors' => ['Black', 'White', 'Blue', 'Red', 'Gold', 'Silver', 'Purple'],
                'conditions' => ['Brand New', 'Like New', 'Good Condition', 'Fair Condition'],
            ],
            'IT & Computers' => [
                'brands' => ['Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Apple', 'MSI', 'Samsung'],
                'models' => ['Inspiron', 'XPS', 'Pavilion', 'ThinkPad', 'IdeaPad', 'VivoBook', 'Aspire', 'MacBook Pro', 'MacBook Air', 'Galaxy Book'],
                'specs' => ['i5 8GB', 'i7 16GB', 'Ryzen 5 8GB', 'Ryzen 7 16GB', 'M1 8GB', 'M2 16GB', 'i3 4GB'],
                'conditions' => ['Brand New', 'Like New', 'Good Condition', 'Refurbished'],
            ],
            'Furniture' => [
                'types' => ['Sofa', 'Bed', 'Table', 'Chair', 'Cabinet', 'Wardrobe', 'Desk', 'Dining Set'],
                'materials' => ['Wood', 'Leather', 'Fabric', 'Metal', 'Glass'],
                'colors' => ['Brown', 'Black', 'White', 'Beige', 'Gray'],
                'rooms' => ['Living Room', 'Bedroom', 'Dining Room', 'Office', 'Kitchen'],
            ],
            'Clothes & Fashion' => [
                'types' => ['Shirt', 'Pant', 'Dress', 'Jacket', 'Shoes', 'Handbag', 'Watch', 'Jewelry'],
                'brands' => ['Nike', 'Adidas', 'Zara', 'H&M', 'Levi\'s', 'Gucci', 'Prada', 'Rolex'],
                'sizes' => ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'],
                'colors' => ['Black', 'White', 'Blue', 'Red', 'Green', 'Brown'],
                'conditions' => ['Brand New', 'Like New', 'Good Condition'],
            ],
            'Sports & Recreation' => [
                'types' => ['Bicycle', 'Treadmill', 'Dumbbells', 'Yoga Mat', 'Tennis Racket', 'Football', 'Basketball', 'Gym Equipment'],
                'brands' => ['Nike', 'Adidas', 'Reebok', 'Under Armour', 'Puma', 'Decathlon'],
                'conditions' => ['Brand New', 'Like New', 'Good Condition', 'Used'],
            ],
            'Home & Garden' => [
                'types' => ['Garden Tools', 'Plants', 'Home Decor', 'Kitchenware', 'Cleaning Supplies', 'Appliances'],
                'materials' => ['Stainless Steel', 'Plastic', 'Wood', 'Ceramic'],
                'brands' => ['Philips', 'Bosch', 'LG', 'Samsung', 'Whirlpool'],
            ],
            'Books & Magazine' => [
                'types' => ['Novel', 'Textbook', 'Comic', 'Magazine', 'Dictionary', 'Encyclopedia'],
                'authors' => ['J.K. Rowling', 'Stephen King', 'Dan Brown', 'Paulo Coelho', 'Harper Lee'],
                'subjects' => ['Mathematics', 'Science', 'History', 'Literature', 'Computer Science'],
                'conditions' => ['Brand New', 'Like New', 'Good Condition', 'Fair Condition'],
            ],
            'Art & Craft' => [
                'types' => ['Painting', 'Sculpture', 'Drawing', 'Handicraft', 'Pottery', 'Digital Art'],
                'artists' => ['Local Artist', 'Professional Artist', 'Student Artist'],
                'materials' => ['Canvas', 'Paper', 'Clay', 'Wood', 'Metal'],
            ],
            'Music & Musical instrument' => [
                'types' => ['Guitar', 'Piano', 'Drums', 'Violin', 'Flute', 'Saxophone'],
                'brands' => ['Yamaha', 'Fender', 'Gibson', 'Roland', 'Casio', 'Korg'],
                'conditions' => ['Brand New', 'Like New', 'Good Condition', 'Vintage'],
            ],
            'Photography' => [
                'brands' => ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Olympus'],
                'models' => ['EOS R5', 'D850', 'A7 III', 'X-T4', 'OM-D E-M1'],
                'conditions' => ['Brand New', 'Like New', 'Good Condition', 'Used'],
            ],
        ];
        
        // Group categories by domain for easier access
        $categoriesByDomain = $itemCategories->groupBy('domain_category');
        
        $ads = [];
        $totalAds = 500; // Generate 500 ads distributed across all item categories
        $postedByOptions = ['user', 'vendor', 'admin'];
        $statusOptions = ['active', 'draft', 'sold', 'expired'];
        
        $this->command->info("Creating {$totalAds} ads...");
        $bar = $this->command->getOutput()->createProgressBar($totalAds);
        $bar->start();
        
        // Distribute ads across item categories
        $adsPerCategory = max(1, floor($totalAds / $itemCategories->count()));
        $remainingAds = $totalAds % $itemCategories->count();
        
        foreach ($itemCategories as $index => $itemCategory) {
            $domainCategory = $itemCategory->domain_category;
            $itemCategoryName = $itemCategory->item_category;
            
            // Calculate how many ads for this category
            $adsForThisCategory = $adsPerCategory;
            if ($index < $remainingAds) {
                $adsForThisCategory++;
            }
            
            // Get templates and data for this domain category
            $templates = $adTemplates[$domainCategory] ?? ['{type} - {location}'];
            $data = $categoryData[$domainCategory] ?? [];
            
            for ($i = 0; $i < $adsForThisCategory; $i++) {
                $template = $templates[array_rand($templates)];
                $title = $template;
                
                // Replace all placeholders
                if (isset($data['types']) && !empty($data['types'])) {
                    $title = str_replace('{type}', $data['types'][array_rand($data['types'])], $title);
                }
                if (isset($data['locations']) && !empty($data['locations'])) {
                    $title = str_replace('{location}', $data['locations'][array_rand($data['locations'])], $title);
                }
                if (isset($data['brands']) && !empty($data['brands'])) {
                    $title = str_replace('{brand}', $data['brands'][array_rand($data['brands'])], $title);
                }
                if (isset($data['models']) && !empty($data['models'])) {
                    $title = str_replace('{model}', $data['models'][array_rand($data['models'])], $title);
                }
                if (isset($data['years']) && !empty($data['years'])) {
                    $title = str_replace('{year}', (string)$data['years'][array_rand($data['years'])], $title);
                }
                if (isset($data['storages']) && !empty($data['storages'])) {
                    $title = str_replace('{storage}', (string)$data['storages'][array_rand($data['storages'])], $title);
                }
                if (isset($data['colors']) && !empty($data['colors'])) {
                    $title = str_replace('{color}', $data['colors'][array_rand($data['colors'])], $title);
                }
                if (isset($data['conditions']) && !empty($data['conditions'])) {
                    $title = str_replace('{condition}', $data['conditions'][array_rand($data['conditions'])], $title);
                }
                if (isset($data['specs']) && !empty($data['specs'])) {
                    $title = str_replace('{specs}', $data['specs'][array_rand($data['specs'])], $title);
                }
                if (isset($data['materials']) && !empty($data['materials'])) {
                    $title = str_replace('{material}', $data['materials'][array_rand($data['materials'])], $title);
                }
                if (isset($data['rooms']) && !empty($data['rooms'])) {
                    $title = str_replace('{room}', $data['rooms'][array_rand($data['rooms'])], $title);
                }
                if (isset($data['sizes']) && !empty($data['sizes'])) {
                    $title = str_replace('{size}', $data['sizes'][array_rand($data['sizes'])], $title);
                }
                if (isset($data['authors']) && !empty($data['authors'])) {
                    $title = str_replace('{author}', $data['authors'][array_rand($data['authors'])], $title);
                }
                if (isset($data['subjects']) && !empty($data['subjects'])) {
                    $title = str_replace('{subject}', $data['subjects'][array_rand($data['subjects'])], $title);
                }
                if (isset($data['artists']) && !empty($data['artists'])) {
                    $title = str_replace('{artist}', $data['artists'][array_rand($data['artists'])], $title);
                }
                
                // Clean up any remaining placeholders and ensure title is not empty
                $title = preg_replace('/\{[^}]+\}/', '', $title);
                $title = trim($title);
                
                // Fallback: if title is still empty, use item category name + item number
                if (empty($title) || $title === '-' || $title === '') {
                    $title = $itemCategoryName . ' Item #' . ($i + 1);
                }
                
                // Generate price based on domain category
                $price = $this->generatePrice($domainCategory);
                
                // Generate description
                $description = $this->generateDescription($title, $domainCategory, $itemCategoryName);
                
                // Randomly select a location (ward)
                $location = $locations->random();
                $locationId = $location->id;
                
                // If location has local addresses, randomly select one (30% chance)
                $selectedLocalAddressIndex = null;
                if ($location->local_address) {
                    $localAddresses = explode(', ', $location->local_address);
                    if (count($localAddresses) > 0 && rand(1, 100) <= 30) {
                        $selectedLocalAddressIndex = rand(0, count($localAddresses) - 1);
                    }
                }
                
                $ads[] = [
                    'user_id' => $users->random()->id,
                    'category_id' => $itemCategory->id, // Use item category ID (lowest level)
                    'location_id' => $locationId, // Assign ward location ID
                    'selected_local_address_index' => $selectedLocalAddressIndex, // Optional: specific local address
                    'title' => $title,
                    'description' => $description,
                    'price' => $price,
                    'status' => $statusOptions[array_rand($statusOptions)],
                    'posted_by' => $postedByOptions[array_rand($postedByOptions)],
                    'views' => rand(0, 5000),
                    'created_at' => now()->subDays(rand(0, 365)),
                    'updated_at' => now()->subDays(rand(0, 365)),
                ];
                
                $bar->advance();
            }
        }
        
        $bar->finish();
        $this->command->newLine();
        
        // Clear existing ads first
        DB::table('ads')->truncate();
        
        // Insert in batches for performance
        $this->command->info('Inserting ads into database...');
        $chunks = array_chunk($ads, 100);
        foreach ($chunks as $chunk) {
            DB::table('ads')->insert($chunk);
        }
        
        $this->command->info("Successfully created " . count($ads) . " ads!");
    }
    
    private function generatePrice(string $domainCategory): float
    {
        $priceRanges = [
            'Property' => [500000, 50000000],
            'Vehicle' => [100000, 10000000],
            'Mobile phone & Gadgets' => [5000, 200000],
            'IT & Computers' => [20000, 500000],
            'Furniture' => [5000, 200000],
            'Clothes & Fashion' => [500, 50000],
            'Sports & Recreation' => [1000, 100000],
            'Home & Garden' => [500, 50000],
            'Books & Magazine' => [100, 5000],
            'Art & Craft' => [1000, 100000],
            'Music & Musical instrument' => [5000, 500000],
            'Photography' => [10000, 500000],
            'Jewelers' => [5000, 500000],
            'Health & Beauty' => [500, 50000],
            'Building & Construction' => [1000, 500000],
            'Business for Sale' => [100000, 10000000],
            'Events/Tickets' => [500, 50000],
            'Farming & Agriculture' => [1000, 200000],
            'Jobs' => [0, 0], // Jobs might not have prices
            'Office Supply' => [100, 50000],
            'Pets & Animal' => [1000, 100000],
            'Travel & Tourism' => [1000, 200000],
            'Bicycle & Accessories' => [5000, 200000],
        ];
        
        $range = $priceRanges[$domainCategory] ?? [1000, 100000];
        if ($range[0] === 0 && $range[1] === 0) {
            return 0; // For categories like Jobs that don't have prices
        }
        return round(rand($range[0], $range[1]) / 100) * 100; // Round to nearest 100
    }
    
    private function generateDescription(string $title, string $domainCategory, string $itemCategory): string
    {
        $descriptions = [
            'Property' => [
                "Beautiful property located in a prime area. Perfect for families looking for a comfortable living space. Well-maintained and ready to move in. Contact for more details.",
                "Spacious property with modern amenities. Great investment opportunity. Located in a safe and accessible neighborhood. Don't miss this chance!",
                "Premium property with excellent facilities. Ideal location with easy access to schools, hospitals, and shopping centers. Schedule a viewing today.",
            ],
            'Vehicle' => [
                "Well-maintained vehicle in excellent condition. Regular servicing done. All documents available. Test drive welcome. Great value for money.",
                "Reliable vehicle with low mileage. Perfect for daily commute. No major accidents. All papers clear. Contact for inspection.",
                "Premium vehicle in like-new condition. Fully serviced and ready to use. Original owner. Best price in market. Hurry!",
            ],
            'Mobile phone & Gadgets' => [
                "Brand new device with all accessories included. Original box and warranty available. Unused and in perfect condition. Best deal guaranteed.",
                "Well-maintained device in excellent condition. All features working perfectly. Original charger and box included. Great value!",
                "Latest model with premium features. Like new condition. All accessories included. Original purchase receipt available.",
            ],
            'IT & Computers' => [
                "High-performance computer perfect for work and gaming. Latest specifications. Well-maintained and in excellent condition. Great deal!",
                "Professional-grade laptop with powerful processor. Ideal for business and creative work. All original accessories included.",
                "Reliable computer system with good specifications. Perfect for students and professionals. Well-maintained and ready to use.",
            ],
            'Furniture' => [
                "Beautiful furniture in excellent condition. Well-maintained and clean. Perfect for your home. Great quality at affordable price.",
                "Premium furniture made from high-quality materials. Comfortable and stylish design. Perfect condition. Don't miss this opportunity!",
                "Modern furniture set in like-new condition. Perfect for modern homes. All pieces included. Great value for money.",
            ],
            'Clothes & Fashion' => [
                "Brand new fashion item with tags. Original packaging included. Perfect fit and style. Great addition to your wardrobe.",
                "Well-maintained fashion item in excellent condition. Gently used. Great quality and style. Best price guaranteed.",
                "Premium fashion item from renowned brand. Like new condition. Original tags and packaging. Don't miss this deal!",
            ],
            'Sports & Recreation' => [
                "High-quality sports equipment in excellent condition. Perfect for fitness enthusiasts. Well-maintained and ready to use.",
                "Professional-grade sports equipment. Great for training and competitions. All accessories included. Best value!",
                "Premium sports gear in like-new condition. Perfect for athletes and fitness lovers. Great quality guaranteed.",
            ],
            'Home & Garden' => [
                "Useful home and garden items in excellent condition. Perfect for your household needs. Great quality at affordable price.",
                "Premium home and garden products. Well-maintained and functional. Great addition to your home. Best deal!",
                "High-quality items for home and garden. Perfect condition. All accessories included. Great value for money.",
            ],
            'Books & Magazine' => [
                "Interesting books in good condition. Perfect for reading enthusiasts. Great collection available. Best prices!",
                "Educational books and magazines. Well-maintained pages. Perfect for students and book lovers. Great value!",
                "Rare and valuable books in excellent condition. Great addition to your library. Don't miss this opportunity!",
            ],
            'Art & Craft' => [
                "Beautiful artwork created by talented artist. Unique and original piece. Perfect for art collectors. Great investment!",
                "Handcrafted item made with care and attention to detail. One-of-a-kind piece. Perfect for home decoration.",
                "Premium art and craft item in excellent condition. Beautiful design and quality materials. Great value!",
            ],
            'Music & Musical instrument' => [
                "Professional musical instrument in excellent condition. Well-maintained and tuned. Perfect for musicians. Great deal!",
                "High-quality instrument with great sound quality. All accessories included. Ideal for beginners and professionals.",
                "Premium musical instrument in like-new condition. Original case and accessories included. Best price guaranteed!",
            ],
            'Photography' => [
                "Professional camera equipment in excellent condition. Perfect for photography enthusiasts. All accessories included.",
                "High-end camera with advanced features. Well-maintained and in perfect working condition. Great investment!",
                "Premium photography equipment. Like new condition. All original accessories and warranty included. Best deal!",
            ],
        ];
        
        $categoryDescriptions = $descriptions[$domainCategory] ?? ["Great {$itemCategory} in excellent condition. Perfect for your needs. Contact for more details."];
        return $categoryDescriptions[array_rand($categoryDescriptions)];
    }
}
