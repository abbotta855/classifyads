<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JobCategory;
use App\Models\Category;

class JobCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing job categories
        JobCategory::truncate();

        // Get all categories from the database
        $categories = Category::all();
        
        // Create a map of category names and subcategory names to IDs
        $categoryMap = [];
        foreach ($categories as $cat) {
            $key = $cat->category . ($cat->sub_category ? ' > ' . $cat->sub_category : '');
            $categoryMap[$key] = $cat->id;
        }

        // Job categories with their corresponding category references
        $jobCategories = [
            [
                'category_name' => 'Jobs',
                'subcategory_name' => 'Full-time',
                'posted_job' => 25,
                'job_status' => 'active',
            ],
            [
                'category_name' => 'Jobs',
                'subcategory_name' => 'Part-time',
                'posted_job' => 18,
                'job_status' => 'active',
            ],
            [
                'category_name' => 'Jobs',
                'subcategory_name' => 'Contract',
                'posted_job' => 12,
                'job_status' => 'active',
            ],
            [
                'category_name' => 'Jobs',
                'subcategory_name' => 'Freelance',
                'posted_job' => 15,
                'job_status' => 'active',
            ],
            [
                'category_name' => 'Jobs',
                'subcategory_name' => 'Internship',
                'posted_job' => 8,
                'job_status' => 'active',
            ],
            [
                'category_name' => 'IT & Computers',
                'subcategory_name' => 'Software',
                'posted_job' => 20,
                'job_status' => 'active',
            ],
            [
                'category_name' => 'IT & Computers',
                'subcategory_name' => 'Networking Equipment',
                'posted_job' => 5,
                'job_status' => 'active',
            ],
            [
                'category_name' => 'Business for Sale',
                'subcategory_name' => 'Online Business',
                'posted_job' => 3,
                'job_status' => 'draft',
            ],
            [
                'category_name' => 'Business for Sale',
                'subcategory_name' => 'Service Business',
                'posted_job' => 7,
                'job_status' => 'active',
            ],
            [
                'category_name' => 'Office Supply',
                'subcategory_name' => 'Office Equipment',
                'posted_job' => 4,
                'job_status' => 'active',
            ],
            [
                'category_name' => 'Photography',
                'subcategory_name' => 'Photo Equipment',
                'posted_job' => 6,
                'job_status' => 'active',
            ],
            [
                'category_name' => 'Health & Beauty',
                'subcategory_name' => 'Fitness Equipment',
                'posted_job' => 9,
                'job_status' => 'active',
            ],
            [
                'category_name' => 'Furniture',
                'subcategory_name' => 'Office Furniture',
                'posted_job' => 11,
                'job_status' => 'active',
            ],
            [
                'category_name' => 'Property',
                'subcategory_name' => 'Commercial Property',
                'posted_job' => 2,
                'job_status' => 'draft',
            ],
            [
                'category_name' => 'Vehicle',
                'subcategory_name' => 'Cars',
                'posted_job' => 14,
                'job_status' => 'active',
            ],
        ];

        foreach ($jobCategories as $jobCategory) {
            // Find the category_id by matching category and subcategory names
            $categoryKey = $jobCategory['category_name'] . ' > ' . $jobCategory['subcategory_name'];
            $categoryId = $categoryMap[$categoryKey] ?? null;

            if ($categoryId) {
                JobCategory::create([
                    'category_id' => $categoryId,
                    'posted_job' => $jobCategory['posted_job'],
                    'job_status' => $jobCategory['job_status'],
                ]);
            } else {
                // If subcategory not found, try to find main category
                $mainCategory = Category::where('category', $jobCategory['category_name'])
                    ->whereNull('sub_category')
                    ->first();
                
                if ($mainCategory) {
                    JobCategory::create([
                        'category_id' => $mainCategory->id,
                        'posted_job' => $jobCategory['posted_job'],
                        'job_status' => $jobCategory['job_status'],
                    ]);
                }
            }
        }
    }
}

