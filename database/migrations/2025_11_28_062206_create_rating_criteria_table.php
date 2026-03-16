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
        Schema::create('rating_criteria', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Delivery on Time", "Value of Money"
            $table->string('description')->nullable();
            $table->integer('sort_order')->default(0); // For ordering criteria
            $table->boolean('is_active')->default(true); // Enable/disable criteria
            $table->timestamps();
            
            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rating_criteria');
    }
};
