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
    Schema::create('photos', function (Blueprint $table) {
      $table->id();
      $table->foreignId('ad_id')->constrained()->onDelete('cascade');
      $table->string('photo_url', 500);
      $table->integer('photo_order')->default(0);
      $table->boolean('is_primary')->default(false);
      $table->timestamps();

      $table->index('ad_id');
      $table->index('is_primary');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('photos');
  }
};
