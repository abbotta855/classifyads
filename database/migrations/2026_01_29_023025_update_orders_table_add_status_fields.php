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
        
        if ($driver === 'pgsql') {
            // PostgreSQL: Check if enum type exists, create new one, migrate data
            DB::statement("DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_new') THEN
                    CREATE TYPE order_status_new AS ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled', 'failed');
                END IF;
            END $$;");
            
            // Drop default, change type, restore default
            DB::statement("ALTER TABLE orders ALTER COLUMN status DROP DEFAULT");
            DB::statement("ALTER TABLE orders ALTER COLUMN status TYPE order_status_new USING status::text::order_status_new");
            DB::statement("ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'::order_status_new");
            
            // Drop old enum type if it exists
            DB::statement("DROP TYPE IF EXISTS order_status_old CASCADE");
            
            Schema::table('orders', function (Blueprint $table) {
                $table->text('shipping_address')->nullable();
                $table->text('notes')->nullable();
            });
        } else {
            // MySQL/MariaDB
            Schema::table('orders', function (Blueprint $table) {
                DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled', 'failed') DEFAULT 'pending'");
                $table->text('shipping_address')->nullable()->after('payment_method');
                $table->text('notes')->nullable()->after('shipping_address');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['shipping_address', 'notes']);
        });
        
        if ($driver === 'pgsql') {
            // PostgreSQL: Revert to old enum
            DB::statement("CREATE TYPE order_status_old AS ENUM('pending', 'completed', 'failed')");
            DB::statement("ALTER TABLE orders ALTER COLUMN status TYPE order_status_old USING status::text::order_status_old");
            DB::statement("DROP TYPE IF EXISTS order_status");
            DB::statement("ALTER TYPE order_status_old RENAME TO order_status");
        } else {
            // MySQL/MariaDB
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'completed', 'failed') DEFAULT 'pending'");
        }
    }
};
