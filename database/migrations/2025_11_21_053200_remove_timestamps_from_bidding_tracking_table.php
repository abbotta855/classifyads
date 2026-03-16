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
    // Check if columns exist before trying to drop them
    if (Schema::hasColumn('bidding_tracking', 'created_at')) {
      Schema::table('bidding_tracking', function (Blueprint $table) {
        $table->dropColumn('created_at');
      });
    }
    if (Schema::hasColumn('bidding_tracking', 'updated_at')) {
      Schema::table('bidding_tracking', function (Blueprint $table) {
        $table->dropColumn('updated_at');
      });
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('bidding_tracking', function (Blueprint $table) {
      $table->timestamps();
    });
  }
};

