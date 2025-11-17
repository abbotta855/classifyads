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
    Schema::create('ads', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->foreignId('category_id')->constrained()->onDelete('restrict');
      $table->string('title');
      $table->text('description');
      $table->decimal('price', 10, 2)->nullable();
      $table->enum('status', ['draft', 'active', 'sold', 'expired', 'removed'])->default('draft');
      $table->boolean('featured')->default(false);
      $table->string('location', 255)->nullable();
      $table->string('youtube_url', 500)->nullable();
      $table->timestamps();

      $table->index('user_id');
      $table->index('category_id');
      $table->index('status');
      $table->index('featured');
      $table->index('location');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('ads');
  }
};
