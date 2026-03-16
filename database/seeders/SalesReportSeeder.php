<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SalesReport;
use App\Models\User;
use App\Models\Ad;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class SalesReportSeeder extends Seeder
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

        foreach ($users as $user) {
            // Count listed items (all ads except draft)
            $listedItems = Ad::where('user_id', $user->id)
                ->whereIn('status', ['active', 'sold', 'expired', 'removed'])
                ->count();

            // Count sold items
            $soldItems = Ad::where('user_id', $user->id)
                ->where('status', 'sold')
                ->count();

            // Calculate earnings from transactions where user is the seller
            $earning = DB::table('transactions')
                ->join('ads', 'transactions.related_ad_id', '=', 'ads.id')
                ->where('transactions.type', 'payment')
                ->where('transactions.status', 'completed')
                ->where('ads.user_id', $user->id)
                ->sum('transactions.amount') ?? 0;

            // Total earning is the same as earning
            $totalEarning = $earning;

            // Only create report if user has listed items or earnings
            if ($listedItems > 0 || $earning > 0) {
                SalesReport::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'listed_items' => $listedItems,
                        'sold_items' => $soldItems,
                        'earning' => round($earning, 2),
                        'total_earning' => round($totalEarning, 2),
                    ]
                );
            }
        }

        $this->command->info('Sales report data created successfully!');
    }
}

