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
        Schema::create('support_management', function (Blueprint $table) {
            $table->id();
            $table->string('issue_error');
            $table->foreignId('issue_reporter_id')->nullable()->constrained('users')->onDelete('set null');
            $table->date('date');
            $table->foreignId('assign_to_id')->nullable()->constrained('users')->onDelete('set null');
            $table->date('assign_date')->nullable();
            $table->enum('error_status', ['pending', 'in_progress', 'resolved', 'closed'])->default('pending');
            $table->text('note_solution')->nullable();
            $table->timestamps();

            $table->index('issue_reporter_id');
            $table->index('assign_to_id');
            $table->index('error_status');
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_management');
    }
};

