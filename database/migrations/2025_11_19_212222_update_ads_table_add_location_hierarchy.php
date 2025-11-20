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
            // Add foreign keys for location hierarchy
            $table->foreignId('province_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('zone_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('district_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('municipality_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('rural_municipality_id')->nullable()->constrained('rural_municipalities')->onDelete('set null');
            $table->foreignId('ward_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('place_id')->nullable()->constrained()->onDelete('set null');
            
            // Keep the old location field for backward compatibility (can be removed later)
            // $table->string('location', 255)->nullable(); // Already exists
            
            // Add indexes for location filtering
            $table->index('province_id');
            $table->index('district_id');
            $table->index('municipality_id');
            $table->index('rural_municipality_id');
            $table->index('ward_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ads', function (Blueprint $table) {
            $table->dropForeign(['province_id']);
            $table->dropForeign(['zone_id']);
            $table->dropForeign(['district_id']);
            $table->dropForeign(['municipality_id']);
            $table->dropForeign(['rural_municipality_id']);
            $table->dropForeign(['ward_id']);
            $table->dropForeign(['place_id']);
            
            $table->dropColumn([
                'province_id',
                'zone_id',
                'district_id',
                'municipality_id',
                'rural_municipality_id',
                'ward_id',
                'place_id'
            ]);
        });
    }
};
