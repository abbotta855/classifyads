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
        // eBook-specific criteria (5 criteria)
        $ebookCriteria = [
            [
                'name' => 'Value of Money',
                'description' => 'Whether the eBook provides good value for the price',
                'criteria_type' => 'ebook',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Worth to Spend Time to Read',
                'description' => 'Whether the eBook is worth the time invested in reading it',
                'criteria_type' => 'ebook',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Well Written',
                'description' => 'The quality of writing, grammar, and structure',
                'criteria_type' => 'ebook',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Interesting to Read',
                'description' => 'How engaging and interesting the content is',
                'criteria_type' => 'ebook',
                'sort_order' => 4,
                'is_active' => true,
            ],
            [
                'name' => 'Recommend to Other',
                'description' => 'Whether you would recommend this eBook to others',
                'criteria_type' => 'ebook',
                'sort_order' => 5,
                'is_active' => true,
            ],
        ];

        // Product-specific criteria (5 criteria)
        $productCriteria = [
            [
                'name' => 'Value of Money',
                'description' => 'Whether the product/service provides good value for the price',
                'criteria_type' => 'product',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'name' => 'Delivery on Time',
                'description' => 'How well the seller delivered the product/service on time',
                'criteria_type' => 'product',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'name' => 'Customer Service',
                'description' => 'The quality of customer service and communication',
                'criteria_type' => 'product',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'name' => 'Product Quality',
                'description' => 'The quality of the product or service received',
                'criteria_type' => 'product',
                'sort_order' => 4,
                'is_active' => true,
            ],
            [
                'name' => 'Packaging',
                'description' => 'The quality of packaging and presentation',
                'criteria_type' => 'product',
                'sort_order' => 5,
                'is_active' => true,
            ],
        ];

        // Seed eBook criteria
        foreach ($ebookCriteria as $criteria) {
            RatingCriteria::firstOrCreate(
                ['name' => $criteria['name'], 'criteria_type' => 'ebook'],
                $criteria
            );
        }

        // Seed product criteria
        foreach ($productCriteria as $criteria) {
            RatingCriteria::firstOrCreate(
                ['name' => $criteria['name'], 'criteria_type' => 'product'],
                $criteria
            );
        }
    }
}
