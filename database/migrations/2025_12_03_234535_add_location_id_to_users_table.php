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
        // First, add location_id column
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('location_id')->nullable()->after('location')->constrained('locations')->onDelete('set null');
            $table->index('location_id');
        });
        
        // Then, drop the old location string column
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Restore the old location column
            $table->string('location', 255)->nullable()->after('role');
        });
        
        Schema::table('users', function (Blueprint $table) {
            // Drop location_id column
            $table->dropForeign(['location_id']);
            $table->dropIndex(['location_id']);
            $table->dropColumn('location_id');
        });
    }
};
