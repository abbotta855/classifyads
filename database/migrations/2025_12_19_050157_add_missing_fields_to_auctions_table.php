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
        Schema::table('auctions', function (Blueprint $table) {
            // Add category_id if it doesn't exist
            if (!Schema::hasColumn('auctions', 'category_id')) {
                $table->foreignId('category_id')->nullable()->after('user_id')->constrained('categories')->onDelete('set null');
                $table->index('category_id');
            }
            
            // Add title if it doesn't exist
            if (!Schema::hasColumn('auctions', 'title')) {
                $table->string('title')->nullable()->after('category_id');
            }
            
            // Add description if it doesn't exist
            if (!Schema::hasColumn('auctions', 'description')) {
                $table->text('description')->nullable()->after('title');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            if (Schema::hasColumn('auctions', 'category_id')) {
                $table->dropForeign(['category_id']);
                $table->dropIndex(['category_id']);
                $table->dropColumn('category_id');
            }
            
            if (Schema::hasColumn('auctions', 'title')) {
                $table->dropColumn('title');
            }
            
            if (Schema::hasColumn('auctions', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};
