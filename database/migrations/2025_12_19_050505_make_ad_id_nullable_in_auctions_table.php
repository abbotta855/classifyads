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
        Schema::table('auctions', function (Blueprint $table) {
            // Drop the unique constraint first (if it exists)
            // Then drop the foreign key constraint
            // Then modify the column to be nullable
            // Then re-add the foreign key constraint (without unique)
        });

        // For PostgreSQL, we need to use raw SQL to modify the constraint
        // Drop unique constraint if it exists
        DB::statement('ALTER TABLE auctions DROP CONSTRAINT IF EXISTS auctions_ad_id_unique');
        
        // Drop foreign key constraint if it exists
        DB::statement('ALTER TABLE auctions DROP CONSTRAINT IF EXISTS auctions_ad_id_foreign');
        
        // Make ad_id nullable
        DB::statement('ALTER TABLE auctions ALTER COLUMN ad_id DROP NOT NULL');
        
        // Re-add foreign key constraint (without unique)
        DB::statement('ALTER TABLE auctions ADD CONSTRAINT auctions_ad_id_foreign FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Make ad_id NOT NULL again and add unique constraint back
        DB::statement('ALTER TABLE auctions DROP CONSTRAINT IF EXISTS auctions_ad_id_foreign');
        DB::statement('ALTER TABLE auctions ALTER COLUMN ad_id SET NOT NULL');
        DB::statement('ALTER TABLE auctions ADD CONSTRAINT auctions_ad_id_foreign FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE');
        DB::statement('ALTER TABLE auctions ADD CONSTRAINT auctions_ad_id_unique UNIQUE (ad_id)');
    }
};
