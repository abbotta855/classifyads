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
    Schema::table('ads', function (Blueprint $table) {
      // Drop foreign keys first
      if (Schema::hasColumn('ads', 'province_id')) {
        $table->dropForeign(['province_id']);
      }
      if (Schema::hasColumn('ads', 'zone_id')) {
        $table->dropForeign(['zone_id']);
      }
      if (Schema::hasColumn('ads', 'district_id')) {
        $table->dropForeign(['district_id']);
      }
      if (Schema::hasColumn('ads', 'municipality_id')) {
        $table->dropForeign(['municipality_id']);
      }
      if (Schema::hasColumn('ads', 'rural_municipality_id')) {
        $table->dropForeign(['rural_municipality_id']);
      }
      if (Schema::hasColumn('ads', 'ward_id')) {
        $table->dropForeign(['ward_id']);
      }
      if (Schema::hasColumn('ads', 'place_id')) {
        $table->dropForeign(['place_id']);
      }
      if (Schema::hasColumn('ads', 'province_id_v2')) {
        $table->dropForeign(['province_id_v2']);
      }
      if (Schema::hasColumn('ads', 'district_id_v2')) {
        $table->dropForeign(['district_id_v2']);
      }
      if (Schema::hasColumn('ads', 'local_level_id')) {
        $table->dropForeign(['local_level_id']);
      }
      if (Schema::hasColumn('ads', 'ward_id_v2')) {
        $table->dropForeign(['ward_id_v2']);
      }

      // Note: Indexes will be automatically dropped when columns are dropped in PostgreSQL
      // Drop columns
      $columnsToDrop = [
        'location',
        'youtube_url',
        'province_id',
        'zone_id',
        'district_id',
        'municipality_id',
        'rural_municipality_id',
        'ward_id',
        'place_id',
        'province_id_v2',
        'district_id_v2',
        'local_level_id',
        'ward_id_v2',
        'item_sold'
      ];

      foreach ($columnsToDrop as $column) {
        if (Schema::hasColumn('ads', $column)) {
          $table->dropColumn($column);
        }
      }
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('ads', function (Blueprint $table) {
      // Re-add columns (simplified - you may need to adjust based on your needs)
      $table->string('location', 255)->nullable();
      $table->string('youtube_url', 500)->nullable();
      $table->boolean('item_sold')->default(false);
      
      // Note: Foreign key columns would need to be re-added with proper constraints
      // This is a simplified rollback - adjust as needed
    });
  }
};
