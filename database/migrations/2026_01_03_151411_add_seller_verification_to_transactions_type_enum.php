<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Note: For PostgreSQL, Laravel's enum() creates a CHECK constraint, not a real enum type.
     * We need to drop the constraint and recreate it with new values.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // Drop the existing check constraint
            DB::statement("
                ALTER TABLE transactions 
                DROP CONSTRAINT IF EXISTS transactions_type_check
            ");
            
            // Add new constraint with all values including 'seller_verification'
            DB::statement("
                ALTER TABLE transactions 
                ADD CONSTRAINT transactions_type_check 
                CHECK (type IN (
                    'deposit',
                    'withdraw',
                    'payment',
                    'refund',
                    'featured_listing',
                    'auction_deposit',
                    'ebook_purchase',
                    'seller_verification'
                ))
            ");
        } else {
            // For MySQL, modify the enum column
            DB::statement("ALTER TABLE transactions MODIFY COLUMN type ENUM(
                'deposit',
                'withdraw',
                'payment',
                'refund',
                'featured_listing',
                'auction_deposit',
                'ebook_purchase',
                'seller_verification'
            )");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // Drop the constraint with seller_verification
            DB::statement("
                ALTER TABLE transactions 
                DROP CONSTRAINT IF EXISTS transactions_type_check
            ");
            
            // Recreate constraint without 'seller_verification'
            DB::statement("
                ALTER TABLE transactions 
                ADD CONSTRAINT transactions_type_check 
                CHECK (type IN (
                    'deposit',
                    'withdraw',
                    'payment',
                    'refund',
                    'featured_listing',
                    'auction_deposit',
                    'ebook_purchase'
                ))
            ");
        } else {
            // For MySQL, revert to original enum values
            DB::statement("ALTER TABLE transactions MODIFY COLUMN type ENUM(
                'deposit',
                'withdraw',
                'payment',
                'refund',
                'featured_listing',
                'auction_deposit',
                'ebook_purchase'
            )");
        }
    }
};
