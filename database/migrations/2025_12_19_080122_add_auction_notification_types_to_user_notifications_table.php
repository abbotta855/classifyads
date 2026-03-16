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
        // For PostgreSQL, Laravel's enum() creates a CHECK constraint, not a real enum type
        // We need to drop the constraint and recreate it with new values
        if (DB::getDriverName() === 'pgsql') {
            // Drop the existing check constraint
            DB::statement("
                ALTER TABLE user_notifications 
                DROP CONSTRAINT IF EXISTS user_notifications_type_check
            ");
            
            // Add new constraint with all values including auction types
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
                'auction_won'
            ) DEFAULT 'system'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
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
                    'review'
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
                'review'
            ) DEFAULT 'system'");
        }
    }
};
