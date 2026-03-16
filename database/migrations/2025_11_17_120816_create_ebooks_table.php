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
    Schema::create('ebooks', function (Blueprint $table) {
      $table->id();
      $table->foreignId('ad_id')->unique()->constrained()->onDelete('cascade');
      $table->string('file_url', 500);
      $table->bigInteger('file_size')->nullable();
      $table->string('file_type', 50)->nullable();
      $table->decimal('price', 10, 2);
      $table->boolean('unlocked')->default(false);
      $table->integer('download_count')->default(0);
      $table->timestamps();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('ebooks');
  }
};
