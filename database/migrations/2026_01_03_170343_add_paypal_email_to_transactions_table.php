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
        Schema::table('transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('transactions', 'paypal_email')) {
                $table->string('paypal_email', 255)->nullable()->after('payment_method');
                $table->index('paypal_email'); // Add index for faster queries
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            if (Schema::hasColumn('transactions', 'paypal_email')) {
                $table->dropIndex(['paypal_email']);
                $table->dropColumn('paypal_email');
            }
        });
    }
};
