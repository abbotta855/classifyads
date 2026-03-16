<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StockManagement;
use App\Models\User;
use App\Models\Category;

class StockManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::whereIn('role', ['user', 'admin'])->get();
        $categories = Category::whereNotNull('sub_category')->get();

        if ($users->isEmpty() || $categories->isEmpty()) {
            $this->command->warn('Not enough users or categories found. Please seed users and categories first.');
            return;
        }

        $items = [
            'Samsung Galaxy S24 Ultra', 'iPhone 15 Pro Max', 'Sony WH-1000XM5 Headphones',
            'Dell XPS 15 Laptop', 'MacBook Air M3', 'PlayStation 5', 'Nintendo Switch OLED',
            'LG C3 OLED TV', 'Dyson V15 Detect Vacuum', 'KitchenAid Stand Mixer',
            'Apple Watch Series 9', 'DJI Mini 4 Pro Drone', 'Canon EOS R6 Mark II',
            'Bose QuietComfort Earbuds II', 'Google Pixel 8 Pro', 'Xbox Series X',
            'Samsung Neo QLED TV', 'Roomba j7+ Robot Vacuum', 'Herman Miller Aeron Chair',
            'Logitech MX Master 3S Mouse', 'Kindle Paperwhite', 'GoPro HERO12 Black',
            'Sonos Era 300 Speaker', 'Theragun PRO', 'Oculus Quest 3', 'Sony Alpha a7 IV',
            'AirPods Pro 2', 'Samsung Odyssey G9 Monitor', 'Secretlab Gaming Chair',
            'Philips Hue Smart Lighting Kit', 'Nike Air Max 270', 'Adidas Ultraboost 22',
            'Samsung 980 PRO SSD', 'Corsair Vengeance RAM', 'ASUS ROG Strix GPU',
            'Razer DeathAdder Mouse', 'SteelSeries Apex Keyboard', 'HyperX Cloud Headset',
            'LG Gram Laptop', 'Surface Pro 9', 'iPad Pro 12.9', 'Samsung Tab S9',
            'OnePlus 12', 'Xiaomi 14 Pro', 'Nothing Phone 2', 'Motorola Edge 40',
            'Realme GT 5', 'Vivo X100', 'Oppo Find X6', 'Honor Magic 5 Pro',
        ];

        $stocks = [];

        for ($i = 0; $i < 50; $i++) {
            $vendor = $users->random();
            $category = $categories->random();
            
            // Random quantity - some items will be low stock
            $quantity = rand(0, 100);
            $soldQty = rand(0, 50);
            $threshold = rand(5, 15); // Random threshold between 5-15
            
            // Ensure some items are low stock for testing alerts
            if ($i < 10) {
                $quantity = rand(0, $threshold); // First 10 items will be low stock
            }

            $stocks[] = [
                'item_name' => $items[array_rand($items)] . ' ' . ($i + 1), // Add number to make unique
                'vendor_seller_id' => $vendor->id,
                'category_id' => $category->id,
                'quantity' => $quantity,
                'sold_item_qty' => $soldQty,
                'low_stock_threshold' => $threshold,
                'low_stock_alert_sent' => $quantity <= $threshold, // Set alert sent if already low
            ];
        }

        foreach ($stocks as $stockData) {
            StockManagement::create($stockData);
        }

        $this->command->info('Created ' . count($stocks) . ' stock items successfully!');
        $this->command->info('Low stock items: ' . StockManagement::whereColumn('quantity', '<=', 'low_stock_threshold')->count());
    }
}

