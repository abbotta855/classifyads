<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AdPostTransaction;
use App\Models\User;
use App\Models\Category;
use Carbon\Carbon;

class AdPostTransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::whereIn('role', ['user', 'admin'])->get();
        $categories = Category::whereNotNull('sub_category')->get();

        if ($users->isEmpty() || $categories->isEmpty()) {
            $this->command->warn('Not enough users or categories found. Please seed users and categories first.');
            return;
        }

        $paymentMethods = ['Credit Card', 'PayPal', 'Bank Transfer', 'Wallet', 'Stripe'];
        $transactions = [];

        for ($i = 0; $i < 30; $i++) {
            $vendor = $users->random();
            $category = $categories->random();
            $numOfAds = rand(1, 50);
            $amount = rand(100, 5000) / 100; // Random amount between 1.00 and 50.00
            $paymentMethod = $paymentMethods[array_rand($paymentMethods)];
            
            // Generate dates - some in past, some current, some future
            $startDate = Carbon::now()->subDays(rand(0, 90));
            $endDate = $startDate->copy()->addDays(rand(30, 365));
            
            // Determine status based on dates
            $status = 'active';
            if ($endDate->isPast()) {
                $status = 'expired';
            } elseif (rand(0, 10) === 0) {
                $status = 'cancelled';
            }

            $transactions[] = [
                'vendor_id' => $vendor->id,
                'num_of_posted_ad' => $numOfAds,
                'category_id' => $category->id,
                'amount' => $amount,
                'payment_method' => $paymentMethod,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'email' => $vendor->email,
                'status' => $status,
            ];
        }

        foreach ($transactions as $transactionData) {
            AdPostTransaction::create($transactionData);
        }

        $this->command->info('Created ' . count($transactions) . ' ad post transactions successfully!');
    }
}

