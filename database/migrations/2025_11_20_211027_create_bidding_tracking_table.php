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
    Schema::create('bidding_tracking', function (Blueprint $table) {
      $table->id();
      $table->foreignId('bid_winner_id')->constrained('bid_winners')->onDelete('cascade');
      $table->string('bid_winner_name');
      $table->string('bid_won_item_name');
      $table->enum('payment_status', ['Pending', 'Completed', 'Failed'])->default('Pending');
      $table->enum('pickup_status', ['Not Started', 'Scheduled', 'Pending', 'Picked Up'])->default('Not Started');
      $table->timestamp('complete_process_date_time')->nullable();
      $table->boolean('alert_sent')->default(false);

      $table->index('bid_winner_id');
      $table->index('payment_status');
      $table->index('pickup_status');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('bidding_tracking');
  }
};
