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
    // For PostgreSQL, we need to drop the constraint first
    DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
    
    // Update existing data before changing the constraint
    DB::statement("UPDATE users SET role = 'user' WHERE role IN ('seller', 'buyer')");
    
    // Recreate the constraint with new enum values
    DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'))");
    DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'");
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    // Revert to original enum
    DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
    DB::statement("UPDATE users SET role = 'buyer' WHERE role = 'user'");
    DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'seller', 'buyer'))");
    DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'buyer'");
  }
};
