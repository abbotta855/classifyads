<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration adds the three-column structure (domain_category, field_category, item_category)
     * to match the Category model and CategorySeeder requirements.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Drop old columns if they exist (from previous structure)
            if (Schema::hasColumn('categories', 'category')) {
                $table->dropColumn('category');
            }
            if (Schema::hasColumn('categories', 'sub_category')) {
                $table->dropColumn('sub_category');
            }
            
            // Add the three-column structure for hierarchical categories
            if (!Schema::hasColumn('categories', 'domain_category')) {
                $table->string('domain_category')->nullable();
            }
            if (!Schema::hasColumn('categories', 'field_category')) {
                $table->string('field_category')->nullable();
            }
            if (!Schema::hasColumn('categories', 'item_category')) {
                $table->string('item_category')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Drop the three-column structure
            if (Schema::hasColumn('categories', 'domain_category')) {
                $table->dropColumn('domain_category');
            }
            if (Schema::hasColumn('categories', 'field_category')) {
                $table->dropColumn('field_category');
            }
            if (Schema::hasColumn('categories', 'item_category')) {
                $table->dropColumn('item_category');
            }
            
            // Restore old columns (for rollback)
            if (!Schema::hasColumn('categories', 'category')) {
                $table->string('category')->nullable();
            }
            if (!Schema::hasColumn('categories', 'sub_category')) {
                $table->string('sub_category')->nullable();
            }
        });
    }
};
