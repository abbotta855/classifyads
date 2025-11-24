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
    if (Schema::hasColumn('bid_winners', 'created_at')) {
      Schema::table('bid_winners', function (Blueprint $table) {
        $table->dropColumn('created_at');
      });
    }
    if (Schema::hasColumn('bid_winners', 'updated_at')) {
      Schema::table('bid_winners', function (Blueprint $table) {
        $table->dropColumn('updated_at');
      });
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('bid_winners', function (Blueprint $table) {
      $table->timestamps();
    });
  }
};

