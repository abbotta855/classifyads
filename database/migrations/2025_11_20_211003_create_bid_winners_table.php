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
    Schema::create('bid_winners', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->foreignId('auction_id')->constrained()->onDelete('cascade');
      $table->string('bidding_item');
      $table->date('bid_start_date');
      $table->date('bid_won_date');
      $table->date('payment_proceed_date');
      $table->decimal('total_payment', 10, 2);
      $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
      $table->boolean('congratulation_email_sent')->default(false);

      $table->index('user_id');
      $table->index('auction_id');
      $table->index('seller_id');
      $table->index('bid_won_date');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('bid_winners');
  }
};
