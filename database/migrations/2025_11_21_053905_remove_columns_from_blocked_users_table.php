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
    $columnsToDrop = [];
    if (Schema::hasColumn('blocked_users', 'is_active')) {
      $columnsToDrop[] = 'is_active';
    }
    if (Schema::hasColumn('blocked_users', 'created_at')) {
      $columnsToDrop[] = 'created_at';
    }
    if (Schema::hasColumn('blocked_users', 'updated_at')) {
      $columnsToDrop[] = 'updated_at';
    }
    
    if (!empty($columnsToDrop)) {
      Schema::table('blocked_users', function (Blueprint $table) use ($columnsToDrop) {
        $table->dropColumn($columnsToDrop);
      });
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('blocked_users', function (Blueprint $table) {
      $table->boolean('is_active')->default(true)->after('reason_to_block');
      $table->timestamps();
    });
  }
};
