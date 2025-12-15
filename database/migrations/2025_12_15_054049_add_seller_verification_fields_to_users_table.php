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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('seller_verified')->default(false)->after('is_verified');
            $table->boolean('seller_verification_fee_paid')->default(false)->after('seller_verified');
            $table->string('seller_verification_payment_id', 255)->nullable()->after('seller_verification_fee_paid');
            $table->string('seller_verification_payment_method', 50)->nullable()->after('seller_verification_payment_id');
            $table->boolean('card_linked')->default(false)->after('seller_verification_payment_method');
            $table->boolean('e_wallet_linked')->default(false)->after('card_linked');
            $table->timestamp('seller_verified_at')->nullable()->after('e_wallet_linked');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'seller_verified',
                'seller_verification_fee_paid',
                'seller_verification_payment_id',
                'seller_verification_payment_method',
                'card_linked',
                'e_wallet_linked',
                'seller_verified_at',
            ]);
        });
    }
};
