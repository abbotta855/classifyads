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
        Schema::table('rating_criteria', function (Blueprint $table) {
            $table->enum('criteria_type', ['ebook', 'product', 'both'])->default('product')->after('description');
            $table->index('criteria_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rating_criteria', function (Blueprint $table) {
            $table->dropIndex(['criteria_type']);
            $table->dropColumn('criteria_type');
        });
    }
};
