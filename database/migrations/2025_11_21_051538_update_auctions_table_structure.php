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
    // Drop created_at column if it exists
    if (Schema::hasColumn('auctions', 'created_at')) {
      Schema::table('auctions', function (Blueprint $table) {
        $table->dropColumn('created_at');
      });
    }

    // Rename columns using raw SQL (Laravel doesn't support renameColumn well in all databases)
    if (Schema::hasColumn('auctions', 'starting_bid')) {
      DB::statement('ALTER TABLE auctions RENAME COLUMN starting_bid TO starting_price');
    }
    if (Schema::hasColumn('auctions', 'current_bid')) {
      DB::statement('ALTER TABLE auctions RENAME COLUMN current_bid TO current_bid_price');
    }

    // Add reserve_price column if it doesn't exist
    if (!Schema::hasColumn('auctions', 'reserve_price')) {
      Schema::table('auctions', function (Blueprint $table) {
        $table->decimal('reserve_price', 10, 2)->nullable()->after('current_bid_price');
      });
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('auctions', function (Blueprint $table) {
      // Remove reserve_price
      $table->dropColumn('reserve_price');
      
      // Re-add created_at
      $table->timestamp('created_at')->nullable();
    });

    // Revert column renames
    DB::statement('ALTER TABLE auctions RENAME COLUMN starting_price TO starting_bid');
    DB::statement('ALTER TABLE auctions RENAME COLUMN current_bid_price TO current_bid');
  }
};
