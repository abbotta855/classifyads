<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::table('auctions', function (Blueprint $table) {
      // Rename columns
      $table->renameColumn('starting_bid', 'starting_price');
      $table->renameColumn('current_bid', 'current_bid_price');
      
      // Add reserve_price column before buy_now_price
      $table->decimal('reserve_price', 10, 2)->nullable()->before('buy_now_price');
      
      // Remove created_at column (keep updated_at)
      $table->dropTimestamps();
      $table->timestamp('updated_at')->nullable();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('auctions', function (Blueprint $table) {
      // Revert column renames
      $table->renameColumn('starting_price', 'starting_bid');
      $table->renameColumn('current_bid_price', 'current_bid');
      
      // Remove reserve_price
      $table->dropColumn('reserve_price');
      
      // Restore created_at
      $table->timestamps();
    });
  }
};

