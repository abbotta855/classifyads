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
        Schema::table('offers', function (Blueprint $table) {
            $table->foreignId('ad_id')->nullable()->after('vendor_id')->constrained('ads')->onDelete('cascade');
            $table->index('ad_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('offers', function (Blueprint $table) {
            $table->dropForeign(['ad_id']);
            $table->dropIndex(['ad_id']);
            $table->dropColumn('ad_id');
        });
    }
};
