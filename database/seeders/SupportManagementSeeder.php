<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SupportManagement;
use App\Models\User;
use Carbon\Carbon;

class SupportManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::whereIn('role', ['user', 'admin'])->get();

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please seed users first.');
            return;
        }

        $issues = [
            'Login page not loading correctly',
            'Unable to upload product images',
            'Payment gateway error',
            'Search functionality not working',
            'Email notifications not being sent',
            'Profile picture upload fails',
            'Cannot reset password',
            'Dashboard showing incorrect data',
            'Mobile responsive layout broken',
            'API endpoint returning 500 error',
            'File upload size limit issue',
            'Database connection timeout',
            'Session timeout too short',
            'Unable to delete account',
            'Two-factor authentication not working',
        ];

        $statuses = ['pending', 'in_progress', 'resolved', 'closed'];
        $supports = [];

        for ($i = 0; $i < 20; $i++) {
            $reporter = $users->random();
            $assignTo = $users->random();
            $status = $statuses[array_rand($statuses)];
            $date = Carbon::now()->subDays(rand(1, 60));
            $assignDate = $status !== 'pending' ? $date->copy()->addDays(rand(1, 10)) : null;

            $supports[] = [
                'issue_error' => $issues[array_rand($issues)] . ' ' . ($i + 1),
                'issue_reporter_id' => $reporter->id,
                'date' => $date,
                'assign_to_id' => $status !== 'pending' ? $assignTo->id : null,
                'assign_date' => $assignDate,
                'error_status' => $status,
                'note_solution' => $status === 'resolved' || $status === 'closed' 
                    ? 'Issue has been resolved by updating the code and testing thoroughly.'
                    : null,
            ];
        }

        foreach ($supports as $supportData) {
            SupportManagement::create($supportData);
        }

        $this->command->info('Created ' . count($supports) . ' support issues successfully!');
    }
}

