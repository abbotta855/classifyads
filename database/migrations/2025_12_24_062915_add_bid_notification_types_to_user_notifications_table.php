<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add bid-related notification types to the constraint
        if (DB::getDriverName() === 'pgsql') {
            // Drop the existing check constraint
            DB::statement("
                ALTER TABLE user_notifications 
                DROP CONSTRAINT IF EXISTS user_notifications_type_check
            ");
            
            // Add new constraint with all values including bid types
            DB::statement("
                ALTER TABLE user_notifications 
                ADD CONSTRAINT user_notifications_type_check 
                CHECK (type IN (
                    'ad_sold',
                    'new_message',
                    'bid_update',
                    'price_drop',
                    'new_match',
                    'system',
                    'payment',
                    'review',
                    'new_auction',
                    'auction_ending_soon',
                    'auction_finished',
                    'auction_won',
                    'bid_placed',
                    'outbid',
                    'bid_cancelled',
                    'proxy_bid_manual_zone'
                ))
            ");
        } else {
            // For MySQL, modify the enum column
            DB::statement("ALTER TABLE user_notifications MODIFY COLUMN type ENUM(
                'ad_sold',
                'new_message',
                'bid_update',
                'price_drop',
                'new_match',
                'system',
                'payment',
                'review',
                'new_auction',
                'auction_ending_soon',
                'auction_finished',
                'auction_won',
                'bid_placed',
                'outbid',
                'bid_cancelled',
                'proxy_bid_manual_zone'
            ) DEFAULT 'system'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to previous constraint (without bid types)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                ALTER TABLE user_notifications 
                DROP CONSTRAINT IF EXISTS user_notifications_type_check
            ");
            
            DB::statement("
                ALTER TABLE user_notifications 
                ADD CONSTRAINT user_notifications_type_check 
                CHECK (type IN (
                    'ad_sold',
                    'new_message',
                    'bid_update',
                    'price_drop',
                    'new_match',
                    'system',
                    'payment',
                    'review',
                    'new_auction',
                    'auction_ending_soon',
                    'auction_finished',
                    'auction_won'
                ))
            ");
        } else {
            DB::statement("ALTER TABLE user_notifications MODIFY COLUMN type ENUM(
                'ad_sold',
                'new_message',
                'bid_update',
                'price_drop',
                'new_match',
                'system',
                'payment',
                'review',
                'new_auction',
                'auction_ending_soon',
                'auction_finished',
                'auction_won'
            ) DEFAULT 'system'");
        }
    }
};
