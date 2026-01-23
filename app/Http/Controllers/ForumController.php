<?php

namespace App\Http\Controllers;

use App\Models\ForumPost;
use App\Models\ForumThread;
use App\Models\ForumPostReaction;
use App\Models\ForumPostReport;
use App\Models\ForumCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class ForumController extends Controller
{
    /**
     * Get all forum categories (cached)
     */
    public function categories()
    {
        $categories = Cache::remember('forum_categories', 3600, function () {
            return ForumCategory::where('is_active', true)
                ->orderBy('sort_order')
                ->get();
        });

        return response()->json($categories);
    }
    public function listThreads(Request $request)
    {
        $query = ForumThread::with(['author', 'category'])
            ->where('is_locked', false)
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at');

        if ($cat = $request->get('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $cat));
        }
        if ($search = $request->get('q')) {
            $query->where('title', 'like', "%{$search}%");
        }

        $threads = $query->paginate(15);
        
        // Ensure all threads have author and category loaded with profile photos
        $threads->getCollection()->transform(function ($thread) {
            if ($thread->author) {
                $thread->author->makeVisible(['profile_picture']);
            }
            return $thread;
        });
        
        return response()->json($threads);
    }

    public function showThread(string $slug)
    {
        $thread = ForumThread::with(['author', 'category'])
            ->where('slug', $slug)
            ->firstOrFail();

        // Increment view count
        $thread->incrementViews();

        // Get first post (question) and replies
        $firstPost = ForumPost::with(['author'])
            ->where('forum_thread_id', $thread->id)
            ->oldest()
            ->first();

        $replies = ForumPost::with(['author'])
            ->where('forum_thread_id', $thread->id)
            ->where('id', '!=', $firstPost?->id)
            ->orderBy('created_at')
            ->get();

        // Load reaction counts for all posts
        $allPostIds = collect([$firstPost?->id, ...$replies->pluck('id')])->filter();
        $reactions = ForumPostReaction::whereIn('forum_post_id', $allPostIds)
            ->selectRaw('forum_post_id, reaction_type, COUNT(*) as count')
            ->groupBy('forum_post_id', 'reaction_type')
            ->get()
            ->groupBy('forum_post_id');

        // Attach reaction counts to posts
        if ($firstPost) {
            $firstPost->reaction_counts = $reactions->get($firstPost->id, collect())
                ->pluck('count', 'reaction_type')
                ->toArray();
        }
        foreach ($replies as $reply) {
            $reply->reaction_counts = $reactions->get($reply->id, collect())
                ->pluck('count', 'reaction_type')
                ->toArray();
        }

        return response()->json([
            'thread' => $thread->load('author', 'category'),
            'question' => $firstPost,
            'replies' => $replies,
            'total_replies' => $replies->count(),
        ]);
    }

    public function createThread(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'nullable|exists:forum_categories,id',
            'content' => 'required|string',
        ]);

        if ($this->isSpam($validated['content'])) {
            return response()->json(['error' => 'Content flagged as spam'], 422);
        }

        $slugBase = Str::slug($validated['title']);
        $slug = $this->uniqueSlug($slugBase);

        $thread = ForumThread::create([
            'user_id' => $request->user()->id,
            'forum_category_id' => $validated['category_id'] ?? null,
            'title' => $validated['title'],
            'slug' => $slug,
            'content' => $validated['content'], // Store content in thread
        ]);

        // Create first post (question) in the thread
        $post = ForumPost::create([
            'forum_thread_id' => $thread->id,
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        // Update thread post count
        $thread->update(['post_count' => 1, 'last_post_id' => $post->id, 'last_post_at' => now()]);

        return response()->json([
            'thread' => $thread->load(['author', 'category']),
            'first_post' => $post->load('author'),
        ], 201);
    }

    public function reply(Request $request, int $threadId)
    {
        $thread = ForumThread::findOrFail($threadId);
        if ($thread->is_locked) {
            return response()->json(['error' => 'Thread is locked'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        if ($this->isSpam($validated['content'])) {
            return response()->json(['error' => 'Content flagged as spam'], 422);
        }

        $post = ForumPost::create([
            'forum_thread_id' => $thread->id,
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        // Update thread post count and last post info
        $thread->increment('post_count');
        $thread->update(['last_post_id' => $post->id, 'last_post_at' => now()]);

        return response()->json($post->load('author'), 201);
    }

    public function react(Request $request, int $postId)
    {
        $request->validate([
            'type' => 'sometimes|string|max:50|in:useful,helpful,like',
        ]);
        $type = $request->input('type', 'like');
        
        $post = ForumPost::findOrFail($postId);
        
        // Check if user already reacted with this type
        $existingReaction = ForumPostReaction::where('forum_post_id', $postId)
            ->where('user_id', $request->user()->id)
            ->where('reaction_type', $type)
            ->first();

        if ($existingReaction) {
            // Toggle: remove reaction if already exists
            $existingReaction->delete();
            $post->updateReactionCount();
            return response()->json(['message' => 'Reaction removed', 'count' => $post->fresh()->reaction_count], 200);
        }

        // Create new reaction
        $reaction = ForumPostReaction::create([
            'forum_post_id' => $postId,
            'user_id' => $request->user()->id,
            'reaction_type' => $type,
        ]);
        
        $post->updateReactionCount();
        
        // Get count by type
        $countByType = $post->reactions()->where('reaction_type', $type)->count();
        
        return response()->json([
            'reaction' => $reaction,
            'count' => $post->fresh()->reaction_count,
            'count_by_type' => $countByType,
        ], 201);
    }

    public function report(Request $request, int $postId)
    {
        $data = $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);
        $report = ForumPostReport::create([
            'forum_post_id' => $postId,
            'user_id' => $request->user()->id,
            'reason' => $data['reason'] ?? null,
        ]);
        return response()->json($report, 201);
    }

    // Simple spam guard helpers
    protected function isSpam(string $text): bool
    {
        if (mb_strlen($text) < 5) {
            return true;
        }
        // Basic URL spam guard
        if (preg_match('/https?:\\/\\//i', $text)) {
            return true;
        }
        // Excessive repeats
        if (preg_match('/(.)\\1{5,}/', $text)) {
            return true;
        }
        return false;
    }

    protected function uniqueSlug(string $baseSlug): string
    {
        $slug = $baseSlug;
        $i = 1;
        while (ForumThread::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $i;
            $i++;
        }
        return $slug;
    }
}
