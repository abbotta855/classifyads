<?php

namespace Database\Seeders;

use App\Models\JobCategory;
use Illuminate\Database\Seeder;

class JobCategoryInitialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jobCategories = [
            'Accounting',
            'Agriculture Job',
            'Architecture Job',
            'Art Job',
            'Automotive Job',
            'Banking Job',
            'Construction Job',
            'Courier & parcel delivery Job',
            'Customer service Job',
            'Education',
            'Engineering job',
            'Executive Job',
            'Fitness Job',
            'Food & Beverage Job',
            'General labor Job',
            'Government job',
            'Healthcare job',
            'Hospitality & tourism job',
            'Human resources job',
            'Insurance Job',
            'Internet Web Job',
            'IT Job',
            'Legal job',
            'Management job',
            'Manufacturing & operations job',
            'Marketing Job',
            'Media & communications job',
            'Office & Administration job',
            'Real estate Job',
            'Retail job',
            'Sales Job',
            'Salon Job',
            'Security Job',
            'Software Developer Job',
            'Spa Job',
            'Systems / network Job',
            'Technical support Job',
            'Television/ Radio Job',
            'Transport Job',
            'Web design Job',
            'Writing / editing Job',
            'Other',
        ];

        foreach ($jobCategories as $categoryName) {
            // Check if category already exists to avoid duplicates
            $existing = JobCategory::where('job_category_name', $categoryName)->first();
            
            if (!$existing) {
                JobCategory::create([
                    'job_category_name' => $categoryName,
                    'posted_job' => 0,
                    'job_status' => 'active',
                ]);
            }
        }
    }
}
