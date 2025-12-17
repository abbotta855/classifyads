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
            // Add selected_local_address_index column (tinyint, nullable)
            // This stores the index (0, 1, 2, etc.) of the selected local address within the ward
            if (!Schema::hasColumn('ads', 'selected_local_address_index')) {
                $table->tinyInteger('selected_local_address_index')->nullable()->after('location_id');
            }
            
            // Add composite index for fast lookups: (location_id, selected_local_address_index)
            // This allows efficient counting of ads by specific address
            $table->index(['location_id', 'selected_local_address_index'], 'ads_location_address_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ads', function (Blueprint $table) {
            // Drop the composite index first
            $table->dropIndex('ads_location_address_index');
            
            // Drop the column
            if (Schema::hasColumn('ads', 'selected_local_address_index')) {
                $table->dropColumn('selected_local_address_index');
            }
        });
    }
};
