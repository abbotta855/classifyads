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
            // Add winner tracking
            if (!Schema::hasColumn('auctions', 'winner_id')) {
                $table->foreignId('winner_id')->nullable()->after('current_bidder_id')->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('auctions', 'winner_notified_at')) {
                $table->timestamp('winner_notified_at')->nullable()->after('winner_id');
            }
            if (!Schema::hasColumn('auctions', 'payment_completed_at')) {
                $table->timestamp('payment_completed_at')->nullable()->after('winner_notified_at');
            }

            // Add location (reuse location system)
            if (!Schema::hasColumn('auctions', 'location_id')) {
                $table->foreignId('location_id')->nullable()->after('ad_id')->constrained()->onDelete('set null');
            }

            // Add images (reuse ad image pattern) - or we can use ad images via ad_id
            if (!Schema::hasColumn('auctions', 'image1_url')) {
                $table->string('image1_url')->nullable()->after('location_id');
            }
            if (!Schema::hasColumn('auctions', 'image2_url')) {
                $table->string('image2_url')->nullable()->after('image1_url');
            }
            if (!Schema::hasColumn('auctions', 'image3_url')) {
                $table->string('image3_url')->nullable()->after('image2_url');
            }
            if (!Schema::hasColumn('auctions', 'image4_url')) {
                $table->string('image4_url')->nullable()->after('image3_url');
            }

            // Add views tracking (reuse ad views pattern)
            if (!Schema::hasColumn('auctions', 'views')) {
                $table->integer('views')->default(0)->after('status');
            }

            // Add slug for SEO URLs (reuse ad slug pattern)
            if (!Schema::hasColumn('auctions', 'slug')) {
                $table->string('slug')->nullable()->after('id');
                $table->index('slug');
            }

            // Add created_at back (useful for sorting)
            if (!Schema::hasColumn('auctions', 'created_at')) {
                $table->timestamp('created_at')->nullable()->after('updated_at');
            }

            // Update status enum to include 'completed'
            // Note: PostgreSQL doesn't support ALTER ENUM easily, so we'll handle this in application logic
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auctions', function (Blueprint $table) {
            $columnsToDrop = [
                'winner_id', 'winner_notified_at', 'payment_completed_at',
                'location_id', 'image1_url', 'image2_url', 'image3_url', 'image4_url',
                'views', 'slug', 'created_at'
            ];
            
            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('auctions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
