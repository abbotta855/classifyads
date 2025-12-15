<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the existing foreign key constraint
        Schema::table('ads', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });

        // Make category_id nullable if it's not already
        Schema::table('ads', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->change();
        });

        // Re-add the foreign key with 'set null' on delete
        Schema::table('ads', function (Blueprint $table) {
            $table->foreign('category_id')
                  ->references('id')
                  ->on('categories')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the foreign key constraint
        Schema::table('ads', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });

        // Re-add with 'restrict' (original behavior)
        Schema::table('ads', function (Blueprint $table) {
            $table->foreign('category_id')
                  ->references('id')
                  ->on('categories')
                  ->onDelete('restrict');
        });
    }
};
