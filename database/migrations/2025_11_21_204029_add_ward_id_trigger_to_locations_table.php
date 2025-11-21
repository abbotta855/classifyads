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
        // Create a trigger function that sets ward_id = id after insert
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

        // Create a trigger that fires AFTER INSERT
        DB::unprepared('
            DROP TRIGGER IF EXISTS locations_set_ward_id_trigger ON locations;
            CREATE TRIGGER locations_set_ward_id_trigger
            AFTER INSERT ON locations
            FOR EACH ROW
            EXECUTE FUNCTION set_ward_id_from_id();
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the trigger and function
        DB::unprepared('DROP TRIGGER IF EXISTS locations_set_ward_id_trigger ON locations;');
        DB::unprepared('DROP FUNCTION IF EXISTS set_ward_id_from_id();');
    }
};
