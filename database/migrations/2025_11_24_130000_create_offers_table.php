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
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->string('item_name');
            $table->foreignId('vendor_id')->constrained('users')->onDelete('cascade');
            $table->decimal('offer_percentage', 5, 2); // e.g., 25.50 for 25.5%
            $table->date('created_date');
            $table->date('valid_until');
            $table->enum('status', ['pending', 'approved'])->default('pending');
            $table->timestamps();

            $table->index('vendor_id');
            $table->index('status');
            $table->index('valid_until');
            $table->index('created_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offers');
    }
};

