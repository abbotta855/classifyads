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
        Schema::table('ads', function (Blueprint $table) {
            $table->string('image1_url', 500)->nullable()->after('youtube_url');
            $table->string('image2_url', 500)->nullable()->after('image1_url');
            $table->string('image3_url', 500)->nullable()->after('image2_url');
            $table->string('image4_url', 500)->nullable()->after('image3_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ads', function (Blueprint $table) {
            $table->dropColumn(['image1_url', 'image2_url', 'image3_url', 'image4_url']);
        });
    }
};
