<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Offer;
use App\Models\User;
use Carbon\Carbon;

class OfferSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get users to use as vendors (users with role 'user' or 'vendor')
        $vendors = User::whereIn('role', ['user', 'admin'])->get();

        if ($vendors->isEmpty()) {
            $this->command->warn('No vendors found. Please seed users first.');
            return;
        }

        $offers = [
            [
                'item_name' => 'Samsung Galaxy S24 Ultra',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 15.50,
                'created_date' => Carbon::now()->subDays(5),
                'valid_until' => Carbon::now()->addDays(25),
                'status' => 'approved',
            ],
            [
                'item_name' => 'MacBook Pro 16" M3',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 20.00,
                'created_date' => Carbon::now()->subDays(3),
                'valid_until' => Carbon::now()->addDays(17),
                'status' => 'approved',
            ],
            [
                'item_name' => 'Nike Air Max 270',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 30.00,
                'created_date' => Carbon::now()->subDays(10),
                'valid_until' => Carbon::now()->addDays(20),
                'status' => 'pending',
            ],
            [
                'item_name' => 'Sony WH-1000XM5 Headphones',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 12.75,
                'created_date' => Carbon::now()->subDays(7),
                'valid_until' => Carbon::now()->addDays(23),
                'status' => 'approved',
            ],
            [
                'item_name' => 'Canon EOS R6 Mark II',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 18.00,
                'created_date' => Carbon::now()->subDays(2),
                'valid_until' => Carbon::now()->addDays(28),
                'status' => 'pending',
            ],
            [
                'item_name' => 'Dell XPS 15 Laptop',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 25.00,
                'created_date' => Carbon::now()->subDays(15),
                'valid_until' => Carbon::now()->addDays(15),
                'status' => 'approved',
            ],
            [
                'item_name' => 'Apple iPhone 15 Pro Max',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 10.00,
                'created_date' => Carbon::now()->subDays(1),
                'valid_until' => Carbon::now()->addDays(29),
                'status' => 'pending',
            ],
            [
                'item_name' => 'LG 65" 4K OLED TV',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 22.50,
                'created_date' => Carbon::now()->subDays(8),
                'valid_until' => Carbon::now()->addDays(22),
                'status' => 'approved',
            ],
            [
                'item_name' => 'Dyson V15 Detect Vacuum',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 35.00,
                'created_date' => Carbon::now()->subDays(12),
                'valid_until' => Carbon::now()->addDays(18),
                'status' => 'pending',
            ],
            [
                'item_name' => 'PlayStation 5 Console',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 15.00,
                'created_date' => Carbon::now()->subDays(4),
                'valid_until' => Carbon::now()->addDays(26),
                'status' => 'approved',
            ],
            [
                'item_name' => 'Tesla Model 3 Accessories Kit',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 40.00,
                'created_date' => Carbon::now()->subDays(6),
                'valid_until' => Carbon::now()->addDays(24),
                'status' => 'pending',
            ],
            [
                'item_name' => 'Rolex Submariner Watch',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 5.00,
                'created_date' => Carbon::now()->subDays(20),
                'valid_until' => Carbon::now()->addDays(10),
                'status' => 'approved',
            ],
            [
                'item_name' => 'Herman Miller Aeron Chair',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 28.00,
                'created_date' => Carbon::now()->subDays(9),
                'valid_until' => Carbon::now()->addDays(21),
                'status' => 'pending',
            ],
            [
                'item_name' => 'DJI Mavic 3 Pro Drone',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 16.50,
                'created_date' => Carbon::now()->subDays(11),
                'valid_until' => Carbon::now()->addDays(19),
                'status' => 'approved',
            ],
            [
                'item_name' => 'KitchenAid Stand Mixer',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 32.00,
                'created_date' => Carbon::now()->subDays(13),
                'valid_until' => Carbon::now()->addDays(17),
                'status' => 'pending',
            ],
            [
                'item_name' => 'Nintendo Switch OLED',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 14.25,
                'created_date' => Carbon::now()->subDays(14),
                'valid_until' => Carbon::now()->addDays(16),
                'status' => 'approved',
            ],
            [
                'item_name' => 'Bose QuietComfort 45',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 19.75,
                'created_date' => Carbon::now()->subDays(16),
                'valid_until' => Carbon::now()->addDays(14),
                'status' => 'pending',
            ],
            [
                'item_name' => 'Microsoft Surface Pro 9',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 21.00,
                'created_date' => Carbon::now()->subDays(18),
                'valid_until' => Carbon::now()->addDays(12),
                'status' => 'approved',
            ],
            [
                'item_name' => 'GoPro HERO 12 Black',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 17.50,
                'created_date' => Carbon::now()->subDays(19),
                'valid_until' => Carbon::now()->addDays(11),
                'status' => 'pending',
            ],
            [
                'item_name' => 'IKEA EKTORP Sofa',
                'vendor_id' => $vendors->random()->id,
                'offer_percentage' => 27.00,
                'created_date' => Carbon::now()->subDays(21),
                'valid_until' => Carbon::now()->addDays(9),
                'status' => 'approved',
            ],
        ];

        foreach ($offers as $offer) {
            Offer::create($offer);
        }

        $this->command->info('Created ' . count($offers) . ' offers successfully!');
    }
}

