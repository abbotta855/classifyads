<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Ad;
use Carbon\Carbon;

class TransactionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::whereIn('role', ['user', 'admin'])->get();
        $ads = Ad::where('status', 'sold')->get();

        if ($users->isEmpty() || $ads->isEmpty()) {
            $this->command->warn('Not enough users or sold ads found. Please seed users and ads first.');
            return;
        }

        $transactions = [];

        // Create payment transactions for sold ads (sellers receiving money)
        foreach ($ads->take(30) as $ad) {
            $buyer = $users->where('id', '!=', $ad->user_id)->random();
            
            $transactions[] = [
                'user_id' => $buyer->id, // Buyer making payment
                'type' => 'payment',
                'amount' => $ad->price ?? rand(500, 50000),
                'status' => 'completed',
                'payment_method' => ['paypal', 'wallet', 'bank_transfer'][rand(0, 2)],
                'payment_id' => 'PAY-' . strtoupper(uniqid()),
                'description' => 'Payment for ad: ' . $ad->title,
                'related_ad_id' => $ad->id,
                'created_at' => Carbon::now()->subDays(rand(1, 60)),
                'updated_at' => Carbon::now()->subDays(rand(1, 60)),
            ];
        }

        // Create some additional payment transactions
        for ($i = 0; $i < 20; $i++) {
            $ad = $ads->random();
            $buyer = $users->where('id', '!=', $ad->user_id)->random();
            
            $transactions[] = [
                'user_id' => $buyer->id,
                'type' => 'payment',
                'amount' => rand(1000, 30000),
                'status' => 'completed',
                'payment_method' => ['paypal', 'wallet'][rand(0, 1)],
                'payment_id' => 'PAY-' . strtoupper(uniqid()),
                'description' => 'Payment for purchase',
                'related_ad_id' => $ad->id,
                'created_at' => Carbon::now()->subDays(rand(1, 90)),
                'updated_at' => Carbon::now()->subDays(rand(1, 90)),
            ];
        }

        // Create some pending/failed transactions for variety
        for ($i = 0; $i < 10; $i++) {
            $ad = $ads->random();
            $buyer = $users->where('id', '!=', $ad->user_id)->random();
            $status = ['pending', 'failed', 'cancelled'][rand(0, 2)];
            
            $transactions[] = [
                'user_id' => $buyer->id,
                'type' => 'payment',
                'amount' => rand(2000, 25000),
                'status' => $status,
                'payment_method' => 'paypal',
                'payment_id' => 'PAY-' . strtoupper(uniqid()),
                'description' => 'Payment attempt',
                'related_ad_id' => $ad->id,
                'created_at' => Carbon::now()->subDays(rand(1, 30)),
                'updated_at' => Carbon::now()->subDays(rand(1, 30)),
            ];
        }

        foreach ($transactions as $transaction) {
            Transaction::create($transaction);
        }

        $this->command->info('Created ' . count($transactions) . ' transactions successfully!');
    }
}

