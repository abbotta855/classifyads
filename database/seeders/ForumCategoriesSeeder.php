<?php

namespace Database\Seeders;

use App\Models\ForumCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ForumCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Announcement',
                'slug' => 'announcement',
                'description' => 'Official announcements and updates from the platform',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Ad post',
                'slug' => 'ad-post',
                'description' => 'Discussions about posting and managing ads',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Payment',
                'slug' => 'payment',
                'description' => 'Questions and discussions about payment systems, e-wallet, and transactions',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Other topics',
                'slug' => 'other-topics',
                'description' => 'General discussions and questions about our services',
                'sort_order' => 4,
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            ForumCategory::firstOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }
    }
}

