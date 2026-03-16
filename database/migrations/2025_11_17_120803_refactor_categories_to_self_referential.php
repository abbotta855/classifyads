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
    // Step 1: Add parent_id and total_ads to categories table first
    Schema::table('categories', function (Blueprint $table) {
      $table->foreignId('parent_id')->nullable()->after('slug')->constrained('categories')->onDelete('cascade');
      $table->integer('total_ads')->default(0)->after('is_active');
    });

    // Step 2: Migrate subcategories data to categories with parent_id
    if (Schema::hasTable('subcategories')) {
      $subcategories = DB::table('subcategories')->get();
      
      foreach ($subcategories as $subcategory) {
        // Insert subcategory as a category with parent_id
        DB::table('categories')->insert([
          'name' => $subcategory->name,
          'slug' => $subcategory->slug,
          'parent_id' => $subcategory->category_id,
          'description' => $subcategory->description,
          'sort_order' => $subcategory->sort_order,
          'is_active' => $subcategory->is_active,
          'total_ads' => 0,
          'created_at' => $subcategory->created_at,
          'updated_at' => $subcategory->updated_at,
        ]);
      }

      // Step 3: Drop subcategories table
      Schema::dropIfExists('subcategories');
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    // Remove parent_id and total_ads
    Schema::table('categories', function (Blueprint $table) {
      $table->dropForeign(['parent_id']);
      $table->dropColumn(['parent_id', 'total_ads']);
    });

    // Recreate subcategories table (data will be lost)
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
