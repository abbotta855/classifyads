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
        Schema::create('sales_report', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('listed_items')->default(0);
            $table->integer('sold_items')->default(0);
            $table->decimal('earning', 10, 2)->default(0);
            $table->decimal('total_earning', 10, 2)->default(0);
            $table->timestamps();

            $table->index('user_id');
            $table->index('total_earning');
            $table->unique('user_id'); // One report per user
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_report');
    }
};

