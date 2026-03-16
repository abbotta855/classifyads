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
    Schema::create('ratings', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Reviewer (buyer)
      $table->foreignId('ad_id')->constrained()->onDelete('cascade');
      $table->foreignId('seller_id')->constrained('users')->onDelete('cascade'); // Being reviewed (seller)
      $table->integer('rating'); // 1-5 stars
      $table->text('comment')->nullable();
      $table->boolean('purchase_verified')->default(false);
      $table->string('purchase_code', 100)->nullable()->unique();
      $table->timestamps();

      $table->index('ad_id');
      $table->index('seller_id');
      $table->index('purchase_verified');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('ratings');
  }
};
