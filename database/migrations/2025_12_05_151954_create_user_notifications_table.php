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
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', [
                'ad_sold',
                'new_message',
                'bid_update',
                'price_drop',
                'new_match',
                'system',
                'payment',
                'review'
            ])->default('system');
            $table->string('title', 255);
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->foreignId('related_ad_id')->nullable()->constrained('ads')->onDelete('set null');
            $table->string('link', 500)->nullable(); // Optional link to related page
            $table->json('metadata')->nullable(); // Additional data (JSON)
            $table->timestamps();
            
            $table->index(['user_id', 'is_read']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
