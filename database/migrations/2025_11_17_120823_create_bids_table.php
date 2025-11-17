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
    Schema::create('bids', function (Blueprint $table) {
      $table->id();
      $table->foreignId('auction_id')->constrained()->onDelete('cascade');
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->decimal('bid_amount', 10, 2);
      $table->boolean('is_winning')->default(false);
      $table->timestamps();

      $table->index(['auction_id', 'bid_amount']);
      $table->index('user_id');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('bids');
  }
};
