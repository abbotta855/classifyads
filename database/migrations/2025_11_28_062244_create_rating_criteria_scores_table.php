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
        Schema::create('rating_criteria_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rating_id')->constrained('ratings')->onDelete('cascade');
            $table->foreignId('rating_criteria_id')->constrained('rating_criteria')->onDelete('cascade');
            $table->integer('score')->default(0); // 1-5 rating for this specific criterion
            $table->timestamps();
            
            // Ensure one score per criterion per rating
            $table->unique(['rating_id', 'rating_criteria_id']);
            $table->index('rating_id');
            $table->index('rating_criteria_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rating_criteria_scores');
    }
};
