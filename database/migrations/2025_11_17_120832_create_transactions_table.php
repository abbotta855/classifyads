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
    Schema::create('transactions', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->enum('type', [
        'deposit',
        'withdraw',
        'payment',
        'refund',
        'featured_listing',
        'auction_deposit',
        'ebook_purchase'
      ]);
      $table->decimal('amount', 10, 2);
      $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending');
      $table->string('payment_method', 50)->nullable();
      $table->string('payment_id', 255)->nullable(); // PayPal transaction ID
      $table->text('description')->nullable();
      $table->foreignId('related_ad_id')->nullable()->constrained('ads')->onDelete('set null');
      $table->timestamps();

      $table->index(['user_id', 'created_at']);
      $table->index(['status', 'created_at']);
      $table->index('payment_id');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('transactions');
  }
};
