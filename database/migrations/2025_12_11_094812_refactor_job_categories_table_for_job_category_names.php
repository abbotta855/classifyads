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
        Schema::table('job_categories', function (Blueprint $table) {
            // Drop foreign key and category_id column
            $table->dropForeign(['category_id']);
            $table->dropIndex(['category_id']);
            $table->dropColumn('category_id');
            
            // Drop sub_category column
            $table->dropColumn('sub_category');
            
            // Add job_category_name column (nullable first, then we'll populate it)
            $table->string('job_category_name')->nullable()->after('id');
        });
        
        // Populate job_category_name from existing category column or set default
        \DB::table('job_categories')->whereNull('job_category_name')->update([
            'job_category_name' => \DB::raw("COALESCE(category, 'Other')")
        ]);
        
        // Now make it NOT NULL
        Schema::table('job_categories', function (Blueprint $table) {
            $table->string('job_category_name')->nullable(false)->change();
        });
        
        // Drop old category and sub_category index if it exists (using raw SQL)
        $indexExists = \DB::selectOne("
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = 'job_categories' 
                AND indexname = 'job_categories_category_sub_category_index'
            ) as exists
        ");
        
        if ($indexExists && $indexExists->exists) {
            \DB::statement('DROP INDEX IF EXISTS job_categories_category_sub_category_index');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_categories', function (Blueprint $table) {
            // Remove job_category_name
            $table->dropColumn('job_category_name');
            
            // Restore sub_category
            $table->string('sub_category')->nullable()->after('category');
            
            // Restore category_id
            $table->foreignId('category_id')->nullable()->after('id')->constrained('categories')->onDelete('set null');
            $table->index('category_id');
            
            // Restore index
            $table->index(['category', 'sub_category']);
        });
    }
};
