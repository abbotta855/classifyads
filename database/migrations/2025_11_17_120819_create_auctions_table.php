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
    Schema::create('auctions', function (Blueprint $table) {
      $table->id();
      $table->foreignId('ad_id')->unique()->constrained()->onDelete('cascade');
      $table->timestamp('start_time');
      $table->timestamp('end_time');
      $table->decimal('starting_bid', 10, 2);
      $table->decimal('current_bid', 10, 2)->nullable();
      $table->foreignId('current_bidder_id')->nullable()->constrained('users')->onDelete('set null');
      $table->decimal('buy_now_price', 10, 2)->nullable();
      $table->decimal('bid_increment', 10, 2)->default(1.00);
      $table->enum('status', ['pending', 'active', 'ended', 'cancelled'])->default('pending');
      $table->timestamps();

      $table->index('status');
      $table->index('end_time');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('auctions');
  }
};
