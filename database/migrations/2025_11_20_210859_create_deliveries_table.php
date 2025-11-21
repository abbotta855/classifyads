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
    Schema::create('deliveries', function (Blueprint $table) {
      $table->id();
      $table->foreignId('seller_vendor_id')->constrained('users')->onDelete('cascade');
      $table->string('item');
      $table->decimal('price', 10, 2);
      $table->enum('delivery_status', ['Pending', 'In Transit', 'Delivered'])->default('Pending');
      $table->date('pickup_date');

      $table->index('seller_vendor_id');
      $table->index('delivery_status');
      $table->index('pickup_date');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('deliveries');
  }
};
