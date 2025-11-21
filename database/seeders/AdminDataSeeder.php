<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AdminDataSeeder extends Seeder
{
  /**
   * Run the database seeds.
   */
  public function run(): void
  {
    // First, create necessary users if they don't exist
    $users = [];
    $userEmails = [
      'seller1@example.com',
      'seller2@example.com',
      'seller3@example.com',
      'seller4@example.com',
      'buyer1@example.com',
      'buyer2@example.com',
      'buyer3@example.com',
      'buyer4@example.com',
      'buyer5@example.com',
      'buyer6@example.com',
      'blocked1@example.com',
      'blocked2@example.com',
      'blocked3@example.com',
      'blocked4@example.com',
    ];

    foreach ($userEmails as $index => $email) {
      $user = DB::table('users')->where('email', $email)->first();
      if (!$user) {
        $userId = DB::table('users')->insertGetId([
          'name' => 'User ' . ($index + 1),
          'email' => $email,
          'password' => Hash::make('password'),
          'role' => 'user',
          'created_at' => now(),
          'updated_at' => now(),
        ]);
        $users[$email] = $userId;
      } else {
        $users[$email] = $user->id;
      }
    }

    // Get or create categories
    $categoryIds = DB::table('categories')->pluck('id')->toArray();
    if (empty($categoryIds)) {
      // Create a default category if none exist
      $categoryId = DB::table('categories')->insertGetId([
        'name' => 'Electronics',
        'slug' => 'electronics',
        'parent_id' => null,
        'description' => 'Electronics category',
        'is_active' => true,
        'sort_order' => 0,
        'total_ads' => 0,
        'created_at' => now(),
        'updated_at' => now(),
      ]);
      $categoryIds = [$categoryId];
    }

    // Create ads if they don't exist
    $adIds = [];
    $adData = [
      ['title' => 'Beautiful Land for Sale in Kathmandu', 'category_id' => $categoryIds[0], 'user_id' => $users['seller1@example.com'] ?? 1, 'price' => 15000000, 'views' => 234, 'posted_by' => 'user'],
      ['title' => 'Toyota Corolla 2020 - Excellent Condition', 'category_id' => $categoryIds[0], 'user_id' => $users['seller2@example.com'] ?? 2, 'price' => 2800000, 'views' => 567, 'posted_by' => 'vendor'],
      ['title' => 'Honda CB 150R - Like New', 'category_id' => $categoryIds[0], 'user_id' => $users['seller1@example.com'] ?? 1, 'price' => 350000, 'views' => 189, 'posted_by' => 'user'],
      ['title' => 'Modern House in Lalitpur', 'category_id' => $categoryIds[0], 'user_id' => $users['seller3@example.com'] ?? 3, 'price' => 12000000, 'views' => 445, 'posted_by' => 'admin'],
      ['title' => 'Isuzu Bus - Commercial Vehicle', 'category_id' => $categoryIds[0], 'user_id' => $users['seller2@example.com'] ?? 2, 'price' => 4500000, 'views' => 123, 'posted_by' => 'vendor'],
      ['title' => 'Tata Truck - Heavy Duty', 'category_id' => $categoryIds[0], 'user_id' => $users['seller1@example.com'] ?? 1, 'price' => 3200000, 'views' => 98, 'posted_by' => 'user'],
      ['title' => 'Luxury Apartment in Baneshwor', 'category_id' => $categoryIds[0], 'user_id' => $users['seller3@example.com'] ?? 3, 'price' => 8500000, 'views' => 312, 'posted_by' => 'admin'],
      ['title' => 'Yamaha FZ - Sports Edition', 'category_id' => $categoryIds[0], 'user_id' => $users['seller1@example.com'] ?? 1, 'price' => 420000, 'views' => 256, 'posted_by' => 'user'],
    ];

    foreach ($adData as $ad) {
      $existingAd = DB::table('ads')->where('title', $ad['title'])->first();
      if (!$existingAd) {
        $adId = DB::table('ads')->insertGetId([
          'user_id' => $ad['user_id'],
          'category_id' => $ad['category_id'],
          'title' => $ad['title'],
          'description' => 'Description for ' . $ad['title'],
          'price' => $ad['price'],
          'views' => $ad['views'],
          'posted_by' => $ad['posted_by'],
          'item_sold' => false,
          'status' => 'active',
          'featured' => false,
          'created_at' => now(),
          'updated_at' => now(),
        ]);
        $adIds[] = $adId;
      } else {
        $adIds[] = $existingAd->id;
      }
    }

    // Create auctions if they don't exist
    $auctionIds = [];
    $auctionData = [
      [
        'ad_id' => $adIds[0] ?? 1, 
        'starting_price' => 50000, 
        'reserve_price' => 45000,
        'current_bid_price' => 65000,
        'current_bidder_id' => $users['buyer4@example.com'] ?? 8,
        'buy_now_price' => 75000, 
        'start_time' => '2024-01-15 10:00:00', 
        'end_time' => '2024-01-22 18:00:00'
      ],
      [
        'ad_id' => $adIds[1] ?? 2, 
        'starting_price' => 120000, 
        'reserve_price' => 110000,
        'current_bid_price' => 150000,
        'current_bidder_id' => $users['buyer5@example.com'] ?? 9,
        'buy_now_price' => 180000, 
        'start_time' => '2024-01-18 14:30:00', 
        'end_time' => '2024-01-25 18:00:00'
      ],
      [
        'ad_id' => $adIds[2] ?? 3, 
        'starting_price' => 25000, 
        'reserve_price' => 22000,
        'current_bid_price' => 35000,
        'current_bidder_id' => $users['buyer6@example.com'] ?? 10,
        'buy_now_price' => 40000, 
        'start_time' => '2024-01-20 09:15:00', 
        'end_time' => '2024-01-27 18:00:00'
      ],
      [
        'ad_id' => $adIds[3] ?? 4, 
        'starting_price' => 85000, 
        'reserve_price' => 80000,
        'current_bid_price' => 95000,
        'current_bidder_id' => $users['buyer1@example.com'] ?? 5,
        'buy_now_price' => 120000, 
        'start_time' => '2024-01-22 10:00:00', 
        'end_time' => '2024-01-29 18:00:00'
      ],
    ];

    foreach ($auctionData as $auction) {
      $existingAuction = DB::table('auctions')->where('ad_id', $auction['ad_id'])->first();
      if (!$existingAuction) {
        $auctionId = DB::table('auctions')->insertGetId([
          'ad_id' => $auction['ad_id'],
          'starting_price' => $auction['starting_price'],
          'reserve_price' => $auction['reserve_price'],
          'current_bid_price' => $auction['current_bid_price'],
          'current_bidder_id' => $auction['current_bidder_id'],
          'buy_now_price' => $auction['buy_now_price'],
          'bid_increment' => 1000,
          'start_time' => $auction['start_time'],
          'end_time' => $auction['end_time'],
          'status' => 'ended',
          'updated_at' => now(),
        ]);
        $auctionIds[] = $auctionId;
      } else {
        // Update existing auction with new column names and data
        DB::table('auctions')
          ->where('ad_id', $auction['ad_id'])
          ->update([
            'starting_price' => $auction['starting_price'],
            'reserve_price' => $auction['reserve_price'],
            'current_bid_price' => $auction['current_bid_price'],
            'current_bidder_id' => $auction['current_bidder_id'],
            'updated_at' => now(),
          ]);
        $auctionIds[] = $existingAuction->id;
      }
    }

    // Seed Deliveries
    if (DB::table('deliveries')->count() == 0) {
      $deliveries = [
        [
          'seller_vendor_id' => $users['seller1@example.com'] ?? 1,
          'item' => 'iPhone 15 Pro',
          'price' => 120000,
          'delivery_status' => 'Pending',
          'pickup_date' => '2024-01-15',
        ],
        [
          'seller_vendor_id' => $users['seller2@example.com'] ?? 2,
          'item' => 'Honda CB 150R',
          'price' => 350000,
          'delivery_status' => 'In Transit',
          'pickup_date' => '2024-01-18',
        ],
        [
          'seller_vendor_id' => $users['seller1@example.com'] ?? 1,
          'item' => 'Modern Sofa Set',
          'price' => 85000,
          'delivery_status' => 'Delivered',
          'pickup_date' => '2024-01-20',
        ],
        [
          'seller_vendor_id' => $users['seller3@example.com'] ?? 3,
          'item' => 'MacBook Pro M3',
          'price' => 250000,
          'delivery_status' => 'Pending',
          'pickup_date' => '2024-01-22',
        ],
        [
          'seller_vendor_id' => $users['seller1@example.com'] ?? 1,
          'item' => 'Designer Handbag',
          'price' => 15000,
          'delivery_status' => 'In Transit',
          'pickup_date' => '2024-01-25',
        ],
        [
          'seller_vendor_id' => $users['seller2@example.com'] ?? 2,
          'item' => 'Toyota Corolla',
          'price' => 2800000,
          'delivery_status' => 'Delivered',
          'pickup_date' => '2024-01-28',
        ],
      ];

      DB::table('deliveries')->insert($deliveries);
    }

    // Seed Purchase Verifications
    if (DB::table('purchase_verifications')->count() == 0) {
      $purchaseVerifications = [
        [
          'buyer_user_id' => $users['buyer1@example.com'] ?? 5,
          'ad_id' => $adIds[0] ?? 1,
          'item' => 'iPhone 15 Pro',
          'price' => 120000,
          'purchase_date' => '2024-01-10',
          'verification_code' => 'PV-2024-001',
          'delivery_status' => 'Pending',
          'created_at' => now(),
          'updated_at' => now(),
        ],
        [
          'buyer_user_id' => $users['buyer2@example.com'] ?? 6,
          'ad_id' => $adIds[1] ?? 2,
          'item' => 'Honda CB 150R',
          'price' => 350000,
          'purchase_date' => '2024-01-12',
          'verification_code' => 'PV-2024-002',
          'delivery_status' => 'In Transit',
          'created_at' => now(),
          'updated_at' => now(),
        ],
        [
          'buyer_user_id' => $users['buyer3@example.com'] ?? 7,
          'ad_id' => $adIds[2] ?? 3,
          'item' => 'Modern Sofa Set',
          'price' => 85000,
          'purchase_date' => '2024-01-14',
          'verification_code' => 'PV-2024-003',
          'delivery_status' => 'Delivered',
          'created_at' => now(),
          'updated_at' => now(),
        ],
        [
          'buyer_user_id' => $users['buyer4@example.com'] ?? 8,
          'ad_id' => $adIds[3] ?? 4,
          'item' => 'MacBook Pro M3',
          'price' => 250000,
          'purchase_date' => '2024-01-16',
          'verification_code' => 'PV-2024-004',
          'delivery_status' => 'Pending',
          'created_at' => now(),
          'updated_at' => now(),
        ],
        [
          'buyer_user_id' => $users['buyer5@example.com'] ?? 9,
          'ad_id' => $adIds[4] ?? 5,
          'item' => 'Designer Handbag',
          'price' => 15000,
          'purchase_date' => '2024-01-18',
          'verification_code' => 'PV-2024-005',
          'delivery_status' => 'In Transit',
          'created_at' => now(),
          'updated_at' => now(),
        ],
        [
          'buyer_user_id' => $users['buyer6@example.com'] ?? 10,
          'ad_id' => $adIds[5] ?? 6,
          'item' => 'Toyota Corolla',
          'price' => 2800000,
          'purchase_date' => '2024-01-20',
          'verification_code' => 'PV-2024-006',
          'delivery_status' => 'Delivered',
          'created_at' => now(),
          'updated_at' => now(),
        ],
      ];

      DB::table('purchase_verifications')->insert($purchaseVerifications);
    }

    // Seed Bidding History
    if (DB::table('bidding_history')->count() == 0) {
      $biddingHistory = [
        [
          'user_id' => $users['buyer1@example.com'] ?? 5,
          'auction_id' => $auctionIds[0] ?? 1,
          'item_name' => 'Vintage Watch Collection',
          'reserve_price' => 50000,
          'buy_now_price' => 75000,
          'payment_method' => 'Credit Card',
          'start_date_time' => '2024-01-15 10:00:00',
        ],
        [
          'user_id' => $users['buyer2@example.com'] ?? 6,
          'auction_id' => $auctionIds[1] ?? 2,
          'item_name' => 'Antique Painting',
          'reserve_price' => 120000,
          'buy_now_price' => 180000,
          'payment_method' => 'Bank Transfer',
          'start_date_time' => '2024-01-18 14:30:00',
        ],
        [
          'user_id' => $users['buyer3@example.com'] ?? 7,
          'auction_id' => $auctionIds[2] ?? 3,
          'item_name' => 'Rare Coin Set',
          'reserve_price' => 25000,
          'buy_now_price' => 40000,
          'payment_method' => 'Digital Wallet',
          'start_date_time' => '2024-01-20 09:15:00',
        ],
      ];

      DB::table('bidding_history')->insert($biddingHistory);
    }

    // Seed Bid Winners
    if (DB::table('bid_winners')->count() == 0) {
      $bidWinners = [
        [
          'user_id' => $users['buyer4@example.com'] ?? 8,
          'auction_id' => $auctionIds[0] ?? 1,
          'bidding_item' => 'Vintage Watch Collection',
          'bid_start_date' => '2024-01-15',
          'bid_won_date' => '2024-01-22',
          'payment_proceed_date' => '2024-01-23',
          'total_payment' => 65000,
          'seller_id' => $users['seller1@example.com'] ?? 1,
          'congratulation_email_sent' => true,
        ],
        [
          'user_id' => $users['buyer5@example.com'] ?? 9,
          'auction_id' => $auctionIds[1] ?? 2,
          'bidding_item' => 'Antique Painting',
          'bid_start_date' => '2024-01-18',
          'bid_won_date' => '2024-01-25',
          'payment_proceed_date' => '2024-01-26',
          'total_payment' => 150000,
          'seller_id' => $users['seller2@example.com'] ?? 2,
          'congratulation_email_sent' => true,
        ],
        [
          'user_id' => $users['buyer6@example.com'] ?? 10,
          'auction_id' => $auctionIds[2] ?? 3,
          'bidding_item' => 'Rare Coin Set',
          'bid_start_date' => '2024-01-20',
          'bid_won_date' => '2024-01-27',
          'payment_proceed_date' => '2024-01-28',
          'total_payment' => 35000,
          'seller_id' => $users['seller3@example.com'] ?? 3,
          'congratulation_email_sent' => true,
        ],
        [
          'user_id' => $users['buyer1@example.com'] ?? 5,
          'auction_id' => $auctionIds[3] ?? 4,
          'bidding_item' => 'Classic Car Model',
          'bid_start_date' => '2024-01-22',
          'bid_won_date' => '2024-01-29',
          'payment_proceed_date' => '2024-01-30',
          'total_payment' => 85000,
          'seller_id' => $users['seller1@example.com'] ?? 1,
          'congratulation_email_sent' => false,
        ],
      ];

      $insertedBidWinners = DB::table('bid_winners')->insert($bidWinners);
    }

    // Seed Blocked Users
    if (DB::table('blocked_users')->count() == 0) {
      $blockedUsers = [
        [
          'user_id' => $users['blocked1@example.com'] ?? 11,
          'email' => 'tom.anderson@example.com',
          'address' => 'Kathmandu, Bagmati Province',
          'date_to_block' => '2024-01-15',
          'reason_to_block' => 'Fraudulent bidding activity',
        ],
        [
          'user_id' => $users['blocked2@example.com'] ?? 12,
          'email' => 'lisa.chen@example.com',
          'address' => 'Lalitpur, Bagmati Province',
          'date_to_block' => '2024-01-18',
          'reason_to_block' => 'Non-payment after winning bid',
        ],
        [
          'user_id' => $users['blocked3@example.com'] ?? 13,
          'email' => 'mark.taylor@example.com',
          'address' => 'Pokhara, Gandaki Province',
          'date_to_block' => '2024-01-20',
          'reason_to_block' => 'Violation of auction terms',
        ],
        [
          'user_id' => $users['blocked4@example.com'] ?? 14,
          'email' => 'anna.martinez@example.com',
          'address' => 'Biratnagar, Province 1',
          'date_to_block' => '2024-01-22',
          'reason_to_block' => 'Multiple account creation',
        ],
      ];

      DB::table('blocked_users')->insert($blockedUsers);
    }

    // Seed Bidding Tracking
    if (DB::table('bidding_tracking')->count() == 0) {
      $bidWinnerIds = DB::table('bid_winners')->pluck('id')->toArray();
      if (!empty($bidWinnerIds)) {
        $biddingTracking = [
          [
            'bid_winner_id' => $bidWinnerIds[0] ?? 1,
            'bid_winner_name' => 'Sarah Williams',
            'bid_won_item_name' => 'Vintage Watch Collection',
            'payment_status' => 'Completed',
            'pickup_status' => 'Picked Up',
            'complete_process_date_time' => '2024-01-24 15:30:00',
            'alert_sent' => false,
          ],
          [
            'bid_winner_id' => $bidWinnerIds[1] ?? 2,
            'bid_winner_name' => 'David Brown',
            'bid_won_item_name' => 'Antique Painting',
            'payment_status' => 'Completed',
            'pickup_status' => 'Pending',
            'complete_process_date_time' => null,
            'alert_sent' => true,
          ],
          [
            'bid_winner_id' => $bidWinnerIds[2] ?? 3,
            'bid_winner_name' => 'Emily Davis',
            'bid_won_item_name' => 'Rare Coin Set',
            'payment_status' => 'Pending',
            'pickup_status' => 'Not Started',
            'complete_process_date_time' => null,
            'alert_sent' => true,
          ],
          [
            'bid_winner_id' => $bidWinnerIds[3] ?? 4,
            'bid_winner_name' => 'Robert Wilson',
            'bid_won_item_name' => 'Classic Car Model',
            'payment_status' => 'Completed',
            'pickup_status' => 'Scheduled',
            'complete_process_date_time' => null,
            'alert_sent' => false,
          ],
        ];

        DB::table('bidding_tracking')->insert($biddingTracking);
      }
    }

    $this->command->info('Admin data seeded successfully!');
  }
}
