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
        Schema::table('auctions', function (Blueprint $table) {
            // Pickup and Delivery Options
            $table->boolean('self_pickup')->default(false)->after('views');
            $table->boolean('seller_delivery')->default(false)->after('self_pickup');
            
            // Payment Methods (stored as JSON array)
            $table->json('payment_methods')->nullable()->after('seller_delivery');
            // Example: ["bank_transfer", "e_wallet", "card_payment"]
            
            // Financing Options
            $table->boolean('financing_available')->default(false)->after('payment_methods');
            $table->json('financing_terms')->nullable()->after('financing_available');
            // Example: {"interest_rate": 5.5, "min_months": 6, "max_months": 36, "institution": "ABC Finance"}
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            $table->dropColumn([
                'self_pickup',
                'seller_delivery',
                'payment_methods',
                'financing_available',
                'financing_terms',
            ]);
        });
    }
};
