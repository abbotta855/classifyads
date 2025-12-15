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
            if (!Schema::hasColumn('transactions', 'ebook_id')) {
                $table->foreignId('ebook_id')->nullable()->after('related_ad_id')->constrained()->onDelete('set null');
            }
            if (!Schema::hasColumn('transactions', 'verification_code')) {
                $table->string('verification_code', 100)->nullable()->unique()->after('ebook_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['ebook_id']);
            $table->dropColumn(['ebook_id', 'verification_code']);
        });
    }
};
