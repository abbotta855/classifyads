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
        Schema::table('buyer_seller_messages', function (Blueprint $table) {
            // Make ad_id nullable since messages can be for auctions too
            $table->foreignId('ad_id')->nullable()->change();
            
            // Add auction_id for auction-related messages
            $table->foreignId('auction_id')->nullable()->after('ad_id')->constrained('auctions')->onDelete('cascade');
            
            // Add index for auction messages
            $table->index(['auction_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buyer_seller_messages', function (Blueprint $table) {
            $table->dropForeign(['auction_id']);
            $table->dropIndex(['auction_id', 'created_at']);
            $table->dropColumn('auction_id');
            
            // Revert ad_id to not nullable (if needed)
            $table->foreignId('ad_id')->nullable(false)->change();
        });
    }
};
