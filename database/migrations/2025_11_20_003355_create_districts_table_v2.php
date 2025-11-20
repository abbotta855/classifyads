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
        Schema::create('districts_v2', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('province_id')->constrained('provinces_v2')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('province_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('districts_v2');
    }
};
