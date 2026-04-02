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
    $driver = DB::getDriverName();

    // Update existing data before changing DB-specific constraints/defaults
    DB::statement("UPDATE users SET role = 'user' WHERE role IN ('seller', 'buyer')");

    // Constraint/default syntax below is PostgreSQL specific.
    if ($driver === 'pgsql') {
      DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
      DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'))");
      DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'");
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    $driver = DB::getDriverName();

    DB::statement("UPDATE users SET role = 'buyer' WHERE role = 'user'");

    if ($driver === 'pgsql') {
      DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
      DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'seller', 'buyer'))");
      DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'buyer'");
    }
  }
};
