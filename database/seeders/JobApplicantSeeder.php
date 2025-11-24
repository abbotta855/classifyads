<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JobApplicant;
use Carbon\Carbon;

class JobApplicantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $applicants = [
            [
                'job_title' => 'Senior Frontend Developer',
                'posted_date' => Carbon::now()->subDays(5)->toDateString(),
                'expected_salary' => 180000,
                'applicant_name' => 'Aarav Sharma',
                'interview_date' => Carbon::now()->addDays(3)->toDateString(),
                'job_progress' => 'interview',
            ],
            [
                'job_title' => 'Backend Engineer (Laravel)',
                'posted_date' => Carbon::now()->subDays(8)->toDateString(),
                'expected_salary' => 200000,
                'applicant_name' => 'Prakash Koirala',
                'interview_date' => Carbon::now()->addDays(1)->toDateString(),
                'job_progress' => 'screening',
            ],
            [
                'job_title' => 'UI/UX Designer',
                'posted_date' => Carbon::now()->subDays(3)->toDateString(),
                'expected_salary' => 120000,
                'applicant_name' => 'Sita Adhikari',
                'interview_date' => Carbon::now()->addDays(5)->toDateString(),
                'job_progress' => 'interview',
            ],
            [
                'job_title' => 'Digital Marketing Specialist',
                'posted_date' => Carbon::now()->subDays(10)->toDateString(),
                'expected_salary' => 90000,
                'applicant_name' => 'Manisha Gurung',
                'interview_date' => null,
                'job_progress' => 'applied',
            ],
            [
                'job_title' => 'Project Manager',
                'posted_date' => Carbon::now()->subDays(14)->toDateString(),
                'expected_salary' => 220000,
                'applicant_name' => 'Saurav Pant',
                'interview_date' => Carbon::now()->addDays(2)->toDateString(),
                'job_progress' => 'offer',
            ],
            [
                'job_title' => 'Support Executive',
                'posted_date' => Carbon::now()->subDays(4)->toDateString(),
                'expected_salary' => 60000,
                'applicant_name' => 'Bikash Thapa',
                'interview_date' => Carbon::now()->addDays(7)->toDateString(),
                'job_progress' => 'screening',
            ],
            [
                'job_title' => 'Accountant',
                'posted_date' => Carbon::now()->subDays(6)->toDateString(),
                'expected_salary' => 80000,
                'applicant_name' => 'Rita Dahal',
                'interview_date' => null,
                'job_progress' => 'applied',
            ],
            [
                'job_title' => 'HR Generalist',
                'posted_date' => Carbon::now()->subDays(9)->toDateString(),
                'expected_salary' => 100000,
                'applicant_name' => 'Nabin KC',
                'interview_date' => Carbon::now()->addDays(4)->toDateString(),
                'job_progress' => 'interview',
            ],
        ];

        foreach ($applicants as $applicant) {
            JobApplicant::create($applicant);
        }
    }
}
