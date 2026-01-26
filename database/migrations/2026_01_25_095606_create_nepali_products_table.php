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
        Schema::create('nepali_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title', 150);
            $table->string('slug', 255)->unique();
            $table->string('company_name', 255);
            $table->text('company_history')->nullable(); // Max 2000 chars enforced in validation
            $table->text('company_address');
            $table->decimal('company_latitude', 10, 8)->nullable();
            $table->decimal('company_longitude', 11, 8)->nullable();
            $table->foreignId('category_id')->constrained()->onDelete('restrict');
            $table->foreignId('subcategory_id')->nullable()->constrained('categories')->onDelete('restrict');
            $table->string('production_items', 255);
            $table->text('materials_use');
            $table->text('nutrition_info')->nullable();
            $table->text('usability');
            $table->string('quantity', 100)->nullable();
            $table->string('size', 100)->nullable();
            $table->string('shape', 100)->nullable();
            $table->string('color', 100)->nullable();
            $table->text('package_info')->nullable();
            $table->date('manufacture_date')->nullable();
            $table->date('best_before')->nullable();
            $table->decimal('retail_price', 10, 2)->nullable();
            $table->decimal('wholesale_price', 10, 2)->nullable();
            $table->string('retail_contact', 255)->nullable();
            $table->string('wholesale_contact', 255)->nullable();
            $table->boolean('is_made_in_nepal')->default(true);
            $table->boolean('has_nepali_address')->default(true);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->integer('views')->default(0);
            $table->decimal('rating_average', 3, 2)->default(0);
            $table->integer('rating_count')->default(0);
            $table->timestamps();
            
            $table->index(['status', 'category_id']);
            $table->index('rating_average');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nepali_products');
    }
};
