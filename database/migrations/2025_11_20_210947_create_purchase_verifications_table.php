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
    Schema::create('purchase_verifications', function (Blueprint $table) {
      $table->id();
      $table->foreignId('buyer_user_id')->constrained('users')->onDelete('cascade');
      $table->foreignId('ad_id')->constrained()->onDelete('cascade');
      $table->string('item');
      $table->decimal('price', 10, 2);
      $table->date('purchase_date');
      $table->string('verification_code')->unique();
      $table->enum('delivery_status', ['Pending', 'In Transit', 'Delivered'])->default('Pending');
      $table->timestamps();

      $table->index('buyer_user_id');
      $table->index('ad_id');
      $table->index('verification_code');
      $table->index('purchase_date');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('purchase_verifications');
  }
};
