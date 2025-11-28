<?php

namespace Database\Seeders;

use App\Models\RatingCriteria;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RatingCriteriaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultCriteria = [
            [
                'name' => 'Delivery on Time',
                'description' => 'How well the seller delivered the product/service on time',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Value of Money',
                'description' => 'Whether the product/service provides good value for the price',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Product Quality',
                'description' => 'The quality of the product or service received',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Customer Service',
                'description' => 'The quality of customer service and communication',
                'sort_order' => 4,
                'is_active' => true,
            ],
        ];

        foreach ($defaultCriteria as $criteria) {
            RatingCriteria::firstOrCreate(
                ['name' => $criteria['name']],
                $criteria
            );
        }
    }
}
