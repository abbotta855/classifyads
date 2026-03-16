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
        Schema::create('job_applicants', function (Blueprint $table) {
            $table->id();
            $table->string('job_title');
            $table->date('posted_date')->nullable();
            $table->decimal('expected_salary', 12, 2)->nullable();
            $table->string('applicant_name');
            $table->date('interview_date')->nullable();
            $table->enum('job_progress', ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'])->default('applied');
            $table->timestamps();

            $table->index(['job_title', 'applicant_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_applicants');
    }
};
