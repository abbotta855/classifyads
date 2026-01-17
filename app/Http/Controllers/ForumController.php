<?php

namespace App\Http\Controllers;

use App\Models\ForumPost;
use App\Models\ForumThread;
use App\Models\ForumPostReaction;
use App\Models\ForumPostReport;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ForumController extends Controller
{
    public function listThreads(Request $request)
    {
        $query = ForumThread::with(['author', 'category'])
            ->where('status', 'open')
            ->orderByDesc('is_sticky')
            ->orderByDesc('created_at');

        if ($cat = $request->get('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $cat));
        }
        if ($search = $request->get('q')) {
            $query->where('title', 'like', "%{$search}%");
        }

        $threads = $query->paginate(15);
        return response()->json($threads);
    }

    public function showThread(string $slug)
    {
        $thread = ForumThread::with(['author', 'category'])
            ->where('slug', $slug)
            ->firstOrFail();

        $posts = ForumPost::with(['author'])
            ->where('thread_id', $thread->id)
            ->orderBy('created_at')
            ->paginate(20);

        return response()->json([
            'thread' => $thread,
            'posts' => $posts,
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
            'category_id' => $validated['category_id'] ?? null,
            'title' => $validated['title'],
            'slug' => $slug,
        ]);

        $post = ForumPost::create([
            'thread_id' => $thread->id,
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        return response()->json([
            'thread' => $thread->load(['author', 'category']),
            'first_post' => $post->load('author'),
        ], 201);
    }

    public function reply(Request $request, int $threadId)
    {
        $thread = ForumThread::findOrFail($threadId);
        if ($thread->status === 'locked') {
            return response()->json(['error' => 'Thread is locked'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string',
        ]);

        if ($this->isSpam($validated['content'])) {
            return response()->json(['error' => 'Content flagged as spam'], 422);
        }

        $post = ForumPost::create([
            'thread_id' => $thread->id,
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        return response()->json($post->load('author'), 201);
    }

    public function react(Request $request, int $postId)
    {
        $request->validate([
            'type' => 'sometimes|string|max:50',
        ]);
        $type = $request->input('type', 'like');
        $reaction = ForumPostReaction::firstOrCreate([
            'post_id' => $postId,
            'user_id' => $request->user()->id,
            'type' => $type,
        ]);
        return response()->json($reaction, 201);
    }

    public function report(Request $request, int $postId)
    {
        $data = $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);
        $report = ForumPostReport::create([
            'post_id' => $postId,
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
