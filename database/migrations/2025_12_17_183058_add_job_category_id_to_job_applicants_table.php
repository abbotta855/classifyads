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
        Schema::table('job_applicants', function (Blueprint $table) {
            $table->foreignId('job_category_id')->nullable()->after('id')->constrained('job_categories')->onDelete('set null');
            $table->index('job_category_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_applicants', function (Blueprint $table) {
            $table->dropForeign(['job_category_id']);
            $table->dropIndex(['job_category_id']);
            $table->dropColumn('job_category_id');
        });
    }
};
