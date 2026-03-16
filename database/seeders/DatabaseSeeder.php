<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->call([
            SuperAdminSeeder::class,
            CategorySeeder::class,
            LocationSeeder::class,
            AdminDataSeeder::class,
            JobCategoryInitialSeeder::class,
            JobApplicantSeeder::class,
            LiveChatSeeder::class,
            OfferSeeder::class,
            RatingSeeder::class,
            TransactionSeeder::class,
            SalesReportSeeder::class,
            StockManagementSeeder::class,
            EmailSubscriberSeeder::class,
            SupportManagementSeeder::class,
            AdPostTransactionSeeder::class,
            ForumCategoriesSeeder::class,
            StaticPageSeeder::class,
        ]);
    }
}
