<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Rating;
use App\Models\User;
use App\Models\Ad;
use Carbon\Carbon;

class RatingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::whereIn('role', ['user', 'admin'])->get();
        $ads = Ad::all();

        if ($users->isEmpty() || $ads->isEmpty()) {
            $this->command->warn('Not enough users or ads found. Please seed users and ads first.');
            return;
        }

        // Generate more diverse ratings
        $ratingComments = [
            ['rating' => 5, 'comment' => 'Excellent product! Very satisfied with the purchase.'],
            ['rating' => 5, 'comment' => 'Perfect condition, exactly as described.'],
            ['rating' => 5, 'comment' => 'Amazing seller! Very responsive and helpful.'],
            ['rating' => 5, 'comment' => 'Outstanding service! Will definitely buy again.'],
            ['rating' => 5, 'comment' => 'Exceeded expectations! Highly recommended.'],
            ['rating' => 5, 'comment' => 'Best purchase I\'ve made! Seller is very professional.'],
            ['rating' => 5, 'comment' => 'Perfect! Fast delivery and excellent quality.'],
            ['rating' => 5, 'comment' => 'Top-notch quality and great communication.'],
            ['rating' => 5, 'comment' => 'Absolutely fantastic! Would buy from again.'],
            ['rating' => 4, 'comment' => 'Good quality, fast shipping. Would recommend.'],
            ['rating' => 4, 'comment' => 'Great value for money. Happy with the purchase.'],
            ['rating' => 4, 'comment' => 'Good product quality. Packaging could be better.'],
            ['rating' => 4, 'comment' => 'Smooth transaction. Product as described.'],
            ['rating' => 4, 'comment' => 'Good experience overall. Would buy from this seller again.'],
            ['rating' => 4, 'comment' => 'Nice product, good seller communication.'],
            ['rating' => 4, 'comment' => 'Satisfied with the purchase. As expected.'],
            ['rating' => 4, 'comment' => 'Good deal, product works well.'],
            ['rating' => 3, 'comment' => 'Product is okay, but shipping took longer than expected.'],
            ['rating' => 3, 'comment' => 'Average product. Nothing special.'],
            ['rating' => 3, 'comment' => 'Decent quality, but could be better.'],
            ['rating' => 3, 'comment' => 'It\'s fine, but not exceptional.'],
            ['rating' => 2, 'comment' => 'Product had some issues, but seller was willing to help.'],
            ['rating' => 2, 'comment' => 'Not as described, but seller resolved the issue.'],
            ['rating' => 1, 'comment' => 'Poor quality, disappointed with the purchase.'],
        ];

        $ratings = [];
        
        // Create 50 ratings with diverse data
        for ($i = 0; $i < 50; $i++) {
            $randomComment = $ratingComments[array_rand($ratingComments)];
            $user = $users->random();
            $seller = $users->random();
            
            // Ensure user and seller are different
            while ($user->id === $seller->id) {
                $seller = $users->random();
            }
            
            $ratings[] = [
                'user_id' => $user->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $seller->id,
                'rating' => $randomComment['rating'],
                'comment' => $randomComment['comment'],
                'purchase_verified' => rand(0, 10) > 1, // 90% verified
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ];
        }

        // Also add the original specific ratings for variety
        $specificRatings = [
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 5,
                'comment' => 'Excellent product! Very satisfied with the purchase.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 4,
                'comment' => 'Good quality, fast shipping. Would recommend.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 5,
                'comment' => 'Perfect condition, exactly as described.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 3,
                'comment' => 'Product is okay, but shipping took longer than expected.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 5,
                'comment' => 'Amazing seller! Very responsive and helpful.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 4,
                'comment' => 'Great value for money. Happy with the purchase.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 2,
                'comment' => 'Product had some issues, but seller was willing to help.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 5,
                'comment' => 'Outstanding service! Will definitely buy again.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 4,
                'comment' => 'Good product quality. Packaging could be better.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 5,
                'comment' => 'Exceeded expectations! Highly recommended.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 3,
                'comment' => 'Average product. Nothing special.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 4,
                'comment' => 'Smooth transaction. Product as described.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 5,
                'comment' => 'Best purchase I\'ve made! Seller is very professional.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
            [
                'user_id' => $users->random()->id,
                'ad_id' => $ads->random()->id,
                'seller_id' => $users->random()->id,
                'rating' => 4,
                'comment' => 'Good experience overall. Would buy from this seller again.',
                'purchase_verified' => true,
                'purchase_code' => 'PURCH-' . strtoupper(uniqid()),
            ],
        ];

        // Merge specific ratings with generated ones
        foreach ($specificRatings as $rating) {
            // Ensure user_id and seller_id are different
            while ($rating['user_id'] === $rating['seller_id']) {
                $rating['seller_id'] = $users->random()->id;
            }
            $ratings[] = $rating;
        }

        foreach ($ratings as $rating) {
            // Ensure user_id and seller_id are different
            while ($rating['user_id'] === $rating['seller_id']) {
                $rating['seller_id'] = $users->random()->id;
            }
            
            Rating::create($rating);
        }

        $this->command->info('Created ' . count($ratings) . ' ratings successfully!');
    }
}

