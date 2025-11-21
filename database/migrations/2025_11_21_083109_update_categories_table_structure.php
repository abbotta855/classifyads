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
        // Drop subcategories table if it exists
        Schema::dropIfExists('subcategories');

        Schema::table('categories', function (Blueprint $table) {
            // Drop foreign key constraint for parent_id if it exists
            if (Schema::hasColumn('categories', 'parent_id')) {
                // Try to drop foreign key (may fail if it doesn't exist, that's ok)
                try {
                    $table->dropForeign(['parent_id']);
                } catch (\Exception $e) {
                    // Foreign key might not exist, continue
                }
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            // Drop columns that are no longer needed
            $columnsToDrop = ['description', 'icon', 'sort_order', 'is_active', 'created_at', 'updated_at'];
            if (Schema::hasColumn('categories', 'parent_id')) {
                $columnsToDrop[] = 'parent_id';
            }
            if (Schema::hasColumn('categories', 'total_ads')) {
                $columnsToDrop[] = 'total_ads';
            }
            $table->dropColumn($columnsToDrop);
        });

        // Drop unique constraint on slug if it exists
        Schema::table('categories', function (Blueprint $table) {
            try {
                $table->dropUnique(['slug']);
            } catch (\Exception $e) {
                // Unique constraint might not exist, continue
            }
        });

        // Rename columns
        Schema::table('categories', function (Blueprint $table) {
            $table->renameColumn('name', 'category');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->renameColumn('slug', 'sub_category');
        });

        // Make sub_category nullable and add unique constraint
        Schema::table('categories', function (Blueprint $table) {
            $table->string('sub_category')->nullable()->change();
            $table->unique('sub_category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // Rename columns back
            $table->renameColumn('category', 'name');
            $table->renameColumn('sub_category', 'slug');
            
            // Re-add columns
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->foreignId('parent_id')->nullable()->constrained('categories')->onDelete('cascade');
            $table->timestamps();
        });

        // Recreate subcategories table
        Schema::create('subcategories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['category_id', 'slug']);
        });
    }
};
