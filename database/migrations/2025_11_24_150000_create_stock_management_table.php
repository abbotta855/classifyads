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
        Schema::create('stock_management', function (Blueprint $table) {
            $table->id();
            $table->string('item_name');
            $table->foreignId('vendor_seller_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('categories')->onDelete('restrict');
            $table->integer('quantity')->default(0);
            $table->integer('sold_item_qty')->default(0);
            $table->integer('low_stock_threshold')->default(10); // Alert when quantity <= this value
            $table->boolean('low_stock_alert_sent')->default(false); // Track if alert was sent
            $table->timestamps();

            $table->index('vendor_seller_id');
            $table->index('category_id');
            $table->index('quantity');
            $table->index('low_stock_alert_sent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_management');
    }
};

