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
            $table->string('cv_file_url', 500)->nullable()->after('applicant_name');
            $table->string('cover_letter_file_url', 500)->nullable()->after('cv_file_url');
            $table->string('reference_letter_file_url', 500)->nullable()->after('cover_letter_file_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_applicants', function (Blueprint $table) {
            $table->dropColumn(['cv_file_url', 'cover_letter_file_url', 'reference_letter_file_url']);
        });
    }
};
