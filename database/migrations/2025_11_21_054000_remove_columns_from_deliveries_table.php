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
    // Check if ad_id column exists before trying to drop it
    if (Schema::hasColumn('deliveries', 'ad_id')) {
      // Try to drop foreign key if it exists (using try-catch for safety)
      try {
        Schema::table('deliveries', function (Blueprint $table) {
          $table->dropForeign(['ad_id']);
        });
      } catch (\Exception $e) {
        // Foreign key might not exist, continue
      }
      
      Schema::table('deliveries', function (Blueprint $table) {
        $table->dropColumn('ad_id');
      });
    }
    
    // Check if timestamp columns exist before trying to drop them
    $columnsToDrop = [];
    if (Schema::hasColumn('deliveries', 'created_at')) {
      $columnsToDrop[] = 'created_at';
    }
    if (Schema::hasColumn('deliveries', 'updated_at')) {
      $columnsToDrop[] = 'updated_at';
    }
    
    if (!empty($columnsToDrop)) {
      Schema::table('deliveries', function (Blueprint $table) use ($columnsToDrop) {
        $table->dropColumn($columnsToDrop);
      });
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('deliveries', function (Blueprint $table) {
      $table->foreignId('ad_id')->nullable()->after('id')->constrained()->onDelete('cascade');
      $table->timestamps();
    });
  }
};

