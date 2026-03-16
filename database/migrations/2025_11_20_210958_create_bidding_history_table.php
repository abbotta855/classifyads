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
    Schema::create('bidding_history', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->foreignId('auction_id')->constrained()->onDelete('cascade');
      $table->string('item_name');
      $table->decimal('reserve_price', 10, 2);
      $table->decimal('buy_now_price', 10, 2);
      $table->string('payment_method');
      $table->timestamp('start_date_time');

      $table->index('user_id');
      $table->index('auction_id');
      $table->index('start_date_time');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('bidding_history');
  }
};
