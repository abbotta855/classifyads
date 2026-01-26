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
        Schema::create('nepali_product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nepali_product_id')->constrained()->onDelete('cascade');
            $table->string('image_path', 255);
            $table->integer('image_order')->default(0);
            $table->timestamps();
            
            $table->index(['nepali_product_id', 'image_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nepali_product_images');
    }
};
