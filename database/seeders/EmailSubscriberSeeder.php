<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EmailSubscriber;
use App\Models\User;
use Carbon\Carbon;

class EmailSubscriberSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::whereIn('role', ['user', 'admin', 'super_admin'])->get();

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please seed users first to create email subscribers.');
            return;
        }

        $subscriptionVolumes = [1, 3, 5, 10];
        $subscriptionTypes = ['Standard', 'Premium', 'Enterprise', 'Trial'];

        $subscribers = [];

        for ($i = 0; $i < 12; $i++) {
            $user = $users->random();
            $volume = $subscriptionVolumes[array_rand($subscriptionVolumes)];
            $amount = $volume * rand(20, 60);
            $startDate = Carbon::now()->subDays(rand(1, 120));
            $endDate = (clone $startDate)->addDays(rand(30, 120));

            $subscribers[] = [
                'user_id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'subscribe_volume' => $volume,
                'amount' => $amount,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'subscription_type' => $subscriptionTypes[array_rand($subscriptionTypes)],
            ];
        }

        foreach ($subscribers as $subscriberData) {
            EmailSubscriber::create($subscriberData);
        }

        $this->command->info('Created ' . count($subscribers) . ' email subscribers successfully!');
    }
}

