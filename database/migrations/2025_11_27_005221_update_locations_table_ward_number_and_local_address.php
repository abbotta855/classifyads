<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the trigger first if it exists
        DB::unprepared('DROP TRIGGER IF EXISTS locations_set_ward_id_trigger ON locations;');
        DB::unprepared('DROP FUNCTION IF EXISTS set_ward_id_from_id();');

        Schema::table('locations', function (Blueprint $table) {
            // Rename ward_id to ward_number
            $table->renameColumn('ward_id', 'ward_number');
        });

        Schema::table('locations', function (Blueprint $table) {
            // Add local_address column after ward_number
            $table->string('local_address', 500)->nullable()->after('ward_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            // Remove local_address column
            $table->dropColumn('local_address');
        });

        Schema::table('locations', function (Blueprint $table) {
            // Rename ward_number back to ward_id
            $table->renameColumn('ward_number', 'ward_id');
        });

        // Recreate the trigger (if needed for rollback)
        DB::unprepared('
            CREATE OR REPLACE FUNCTION set_ward_id_from_id()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE locations
                SET ward_id = NEW.id
                WHERE id = NEW.id;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        ');

        DB::unprepared('
            DROP TRIGGER IF EXISTS locations_set_ward_id_trigger ON locations;
            CREATE TRIGGER locations_set_ward_id_trigger
            AFTER INSERT ON locations
            FOR EACH ROW
            EXECUTE FUNCTION set_ward_id_from_id();
        ');
    }
};
