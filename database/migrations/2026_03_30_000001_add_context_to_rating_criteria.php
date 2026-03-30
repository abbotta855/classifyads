<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rating_criteria', function (Blueprint $table) {
            $table->unsignedBigInteger('category_id')->nullable()->after('description')->index();
            $table->unsignedBigInteger('subcategory_id')->nullable()->after('category_id')->index();
        });
    }

    public function down(): void
    {
        Schema::table('rating_criteria', function (Blueprint $table) {
            $table->dropColumn(['category_id', 'subcategory_id']);
        });
    }
};

