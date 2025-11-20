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
        Schema::create('wards_v2', function (Blueprint $table) {
            $table->id();
            $table->integer('ward_id'); // The first number (e.g., 1 in "1-32")
            $table->integer('ward_number'); // The second number (e.g., 32 in "1-32")
            $table->foreignId('local_level_id')->constrained('local_levels')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('local_level_id');
            $table->index(['ward_id', 'ward_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wards_v2');
    }
};
