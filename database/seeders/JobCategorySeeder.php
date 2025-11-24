<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JobCategory;

class JobCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'category' => 'Software Development',
                'sub_category' => 'Frontend Developer',
                'posted_job' => 12,
                'job_status' => 'active',
            ],
            [
                'category' => 'Software Development',
                'sub_category' => 'Backend Developer',
                'posted_job' => 8,
                'job_status' => 'active',
            ],
            [
                'category' => 'Design',
                'sub_category' => 'UI/UX Designer',
                'posted_job' => 5,
                'job_status' => 'active',
            ],
            [
                'category' => 'Marketing',
                'sub_category' => 'Digital Marketing Specialist',
                'posted_job' => 4,
                'job_status' => 'draft',
            ],
            [
                'category' => 'Operations',
                'sub_category' => 'Project Manager',
                'posted_job' => 6,
                'job_status' => 'active',
            ],
            [
                'category' => 'Customer Support',
                'sub_category' => 'Support Executive',
                'posted_job' => 10,
                'job_status' => 'closed',
            ],
            [
                'category' => 'Finance',
                'sub_category' => 'Accountant',
                'posted_job' => 3,
                'job_status' => 'draft',
            ],
            [
                'category' => 'Human Resources',
                'sub_category' => 'HR Generalist',
                'posted_job' => 7,
                'job_status' => 'active',
            ],
        ];

        foreach ($categories as $category) {
            JobCategory::create($category);
        }
    }
}
