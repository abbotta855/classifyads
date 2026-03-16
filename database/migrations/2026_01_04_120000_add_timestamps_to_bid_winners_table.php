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
    Schema::table('bid_winners', function (Blueprint $table) {
      if (!Schema::hasColumn('bid_winners', 'created_at')) {
        $table->timestamp('created_at')->nullable()->after('congratulation_email_sent');
      }

      if (!Schema::hasColumn('bid_winners', 'updated_at')) {
        $table->timestamp('updated_at')->nullable()->after('created_at');
      }
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('bid_winners', function (Blueprint $table) {
      if (Schema::hasColumn('bid_winners', 'created_at')) {
        $table->dropColumn('created_at');
      }

      if (Schema::hasColumn('bid_winners', 'updated_at')) {
        $table->dropColumn('updated_at');
      }
    });
  }
};


