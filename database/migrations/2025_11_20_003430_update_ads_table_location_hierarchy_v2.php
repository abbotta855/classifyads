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
            // Add foreign keys for new location hierarchy
            $table->foreignId('province_id_v2')->nullable()->constrained('provinces_v2')->onDelete('set null');
            $table->foreignId('district_id_v2')->nullable()->constrained('districts_v2')->onDelete('set null');
            $table->foreignId('local_level_id')->nullable()->constrained('local_levels')->onDelete('set null');
            $table->foreignId('ward_id_v2')->nullable()->constrained('wards_v2')->onDelete('set null');
            
            // Add indexes for location filtering
            $table->index('province_id_v2');
            $table->index('district_id_v2');
            $table->index('local_level_id');
            $table->index('ward_id_v2');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ads', function (Blueprint $table) {
            $table->dropForeign(['province_id_v2']);
            $table->dropForeign(['district_id_v2']);
            $table->dropForeign(['local_level_id']);
            $table->dropForeign(['ward_id_v2']);
            
            $table->dropColumn([
                'province_id_v2',
                'district_id_v2',
                'local_level_id',
                'ward_id_v2'
            ]);
        });
    }
};
