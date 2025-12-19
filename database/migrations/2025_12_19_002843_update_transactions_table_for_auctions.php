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
            // Add auction_id to link auction payments (reuse pattern from ebook_id)
            if (!Schema::hasColumn('transactions', 'auction_id')) {
                $table->foreignId('auction_id')->nullable()->after('ebook_id')->constrained()->onDelete('set null');
            }
            
            // Add bid_id to link to specific bid
            if (!Schema::hasColumn('transactions', 'bid_id')) {
                $table->foreignId('bid_id')->nullable()->after('auction_id')->constrained()->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            if (Schema::hasColumn('transactions', 'bid_id')) {
                $table->dropForeign(['bid_id']);
                $table->dropColumn('bid_id');
            }
            if (Schema::hasColumn('transactions', 'auction_id')) {
                $table->dropForeign(['auction_id']);
                $table->dropColumn('auction_id');
            }
        });
    }
};
