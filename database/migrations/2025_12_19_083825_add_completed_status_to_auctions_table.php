<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For PostgreSQL, Laravel's enum() creates a CHECK constraint, not a real enum type
        // We need to drop the constraint and recreate it with new values
        if (DB::getDriverName() === 'pgsql') {
            // Drop the existing check constraint
            DB::statement("
                ALTER TABLE auctions 
                DROP CONSTRAINT IF EXISTS auctions_status_check
            ");
            
            // Add new constraint with all values including 'completed'
            DB::statement("
                ALTER TABLE auctions 
                ADD CONSTRAINT auctions_status_check 
                CHECK (status IN (
                    'pending',
                    'active',
                    'ended',
                    'completed',
                    'cancelled'
                ))
            ");
        } else {
            // For MySQL, modify the enum column
            DB::statement("ALTER TABLE auctions MODIFY COLUMN status ENUM(
                'pending',
                'active',
                'ended',
                'completed',
                'cancelled'
            ) DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                ALTER TABLE auctions 
                DROP CONSTRAINT IF EXISTS auctions_status_check
            ");
            
            DB::statement("
                ALTER TABLE auctions 
                ADD CONSTRAINT auctions_status_check 
                CHECK (status IN (
                    'pending',
                    'active',
                    'ended',
                    'cancelled'
                ))
            ");
        } else {
            DB::statement("ALTER TABLE auctions MODIFY COLUMN status ENUM(
                'pending',
                'active',
                'ended',
                'cancelled'
            ) DEFAULT 'pending'");
        }
    }
};
