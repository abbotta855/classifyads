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
    // Drop the old locations table and recreate with new structure
    Schema::dropIfExists('locations');
    
    Schema::create('locations', function (Blueprint $table) {
      $table->id();
      $table->string('province');
      $table->string('district');
      $table->string('local_level');
      $table->enum('local_level_type', ['Metropolitan City', 'Sub-Metropolitan City', 'Municipality', 'Rural Municipality']);
      $table->integer('ward_id');
      $table->timestamps();

      $table->index('province');
      $table->index('district');
      $table->index('local_level');
      $table->index('local_level_type');
      $table->index(['province', 'district']);
      $table->index(['district', 'local_level']);
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('locations');
    
    Schema::create('locations', function (Blueprint $table) {
      $table->id();
      $table->string('name');
      $table->enum('type', ['province', 'district', 'local_level', 'ward', 'place'])->default('place');
      $table->foreignId('parent_id')->nullable()->constrained('locations')->onDelete('cascade');
      $table->string('code')->nullable()->unique();
      $table->integer('ward_number')->nullable();
      $table->timestamps();

      $table->index('type');
      $table->index('parent_id');
      $table->index(['type', 'parent_id']);
    });
  }
};
