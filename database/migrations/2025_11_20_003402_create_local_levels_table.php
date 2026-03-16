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
        Schema::create('local_levels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['municipality', 'rural_municipality']);
            $table->foreignId('district_id')->constrained('districts_v2')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('district_id');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('local_levels');
    }
};
