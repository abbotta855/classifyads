<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ForumThread extends Model
{
    protected $fillable = [
        'user_id',
        'forum_category_id',
        'title',
        'slug',
        'content',
        'is_locked',
        'is_pinned',
        'views',
        'post_count',
        'last_post_id',
        'last_post_at',
    ];

    protected $casts = [
        'is_locked' => 'boolean',
        'is_pinned' => 'boolean',
        'views' => 'integer',
        'post_count' => 'integer',
        'last_post_at' => 'datetime',
    ];

    /**
     * Get the user who created the thread
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
     * Get the category this thread belongs to
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ForumCategory::class, 'forum_category_id');
    }

    /**
     * Get all posts (replies) in this thread
     */
    public function posts(): HasMany
    {
        return $this->hasMany(ForumPost::class, 'forum_thread_id');
    }

    /**
     * Get the first post (question) in this thread
     */
    public function firstPost()
    {
        return $this->hasOne(ForumPost::class, 'forum_thread_id')
            ->oldest();
    }

    /**
     * Get the last post in this thread
     */
    public function lastPost()
    {
        return $this->belongsTo(ForumPost::class, 'last_post_id');
    }

    /**
     * Increment view count
     */
    public function incrementViews(): void
    {
        $this->increment('views');
    }
}

