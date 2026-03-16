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
        // Add performance indexes for forum_threads
        Schema::table('forum_threads', function (Blueprint $table) {
            $table->index(['forum_category_id', 'views'], 'idx_forum_threads_category_views');
            $table->index('created_at', 'idx_forum_threads_created');
            $table->index('views', 'idx_forum_threads_views');
        });

        // Add performance indexes for forum_post_reactions
        Schema::table('forum_post_reactions', function (Blueprint $table) {
            $table->index(['forum_post_id', 'user_id'], 'idx_forum_reactions_post_user');
            $table->index(['forum_post_id', 'reaction_type'], 'idx_forum_reactions_post_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('forum_threads', function (Blueprint $table) {
            $table->dropIndex('idx_forum_threads_category_views');
            $table->dropIndex('idx_forum_threads_created');
            $table->dropIndex('idx_forum_threads_views');
        });

        Schema::table('forum_post_reactions', function (Blueprint $table) {
            $table->dropIndex('idx_forum_reactions_post_user');
            $table->dropIndex('idx_forum_reactions_post_type');
        });
    }
};
