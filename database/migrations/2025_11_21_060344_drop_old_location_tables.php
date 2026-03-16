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
    // Drop tables in reverse dependency order (child tables first, then parent tables)
    // places -> wards -> municipalities/rural_municipalities -> districts -> zones/provinces
    // wards_v2 -> local_levels -> districts_v2 -> provinces_v2
    
    Schema::dropIfExists('places');
    Schema::dropIfExists('wards');
    Schema::dropIfExists('wards_v2');
    Schema::dropIfExists('municipalities');
    Schema::dropIfExists('rural_municipalities');
    Schema::dropIfExists('local_levels');
    Schema::dropIfExists('districts');
    Schema::dropIfExists('districts_v2');
    Schema::dropIfExists('zones');
    Schema::dropIfExists('provinces_v2');
    Schema::dropIfExists('provinces');
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    // Note: This is a destructive migration. 
    // Recreating all these tables would require their original migration files.
    // In a real scenario, you might want to restore from backups.
  }
};
