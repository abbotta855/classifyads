<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ForumPost extends Model
{
    protected $fillable = [
        'forum_thread_id',
        'user_id',
        'content',
        'reaction_count',
        'is_edited',
        'edited_at',
    ];

    protected $casts = [
        'reaction_count' => 'integer',
        'is_edited' => 'boolean',
        'edited_at' => 'datetime',
    ];

    /**
     * Get the thread this post belongs to
     */
    public function thread(): BelongsTo
    {
        return $this->belongsTo(ForumThread::class, 'forum_thread_id');
    }

    /**
     * Get the user who created this post
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Alias for author (for compatibility)
     */
    public function user(): BelongsTo
    {
        return $this->author();
    }

    /**
     * Get all reactions for this post
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(ForumPostReaction::class, 'forum_post_id');
    }

    /**
     * Get reactions by type (useful/helpful)
     */
    public function reactionsByType(string $type)
    {
        return $this->reactions()->where('reaction_type', $type);
    }

    /**
     * Check if user has reacted with specific type
     */
    public function hasUserReaction(int $userId, string $type): bool
    {
        return $this->reactions()
            ->where('user_id', $userId)
            ->where('reaction_type', $type)
            ->exists();
    }

    /**
     * Update reaction count
     */
    public function updateReactionCount(): void
    {
        $this->reaction_count = $this->reactions()->count();
        $this->save();
    }
}

