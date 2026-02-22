<?php

namespace App\Http\Controllers;

use App\Models\ForumThread;
use App\Models\ForumPost;
use App\Models\ForumPostReport;
use Illuminate\Http\Request;

class ForumAdminController extends Controller
{
    /**
     * List all forum threads for moderation
     */
    public function listThreads(Request $request)
    {
        $status = $request->get('status', 'all'); // all, pending, approved, rejected
        $query = ForumThread::with(['author', 'category'])
            ->orderByDesc('created_at');

        if ($status === 'pending') {
            // Assuming there's a status field, or we check if thread has no approved posts
            // For now, we'll return all threads and let frontend filter
        }

        $threads = $query->paginate(50);

        return response()->json($threads);
    }

    /**
     * Approve a thread
     */
    public function approveThread($id)
    {
        $thread = ForumThread::findOrFail($id);
        // If there's a status field, update it
        // For now, threads are auto-approved, so this might not be needed
        return response()->json(['message' => 'Thread approved', 'thread' => $thread]);
    }

    /**
     * Reject/Delete a thread
     */
    public function rejectThread($id, Request $request)
    {
        $thread = ForumThread::findOrFail($id);
        $thread->delete();
        return response()->json(['message' => 'Thread deleted']);
    }

    /**
     * Lock a thread
     */
    public function lockThread($id)
    {
        $thread = ForumThread::findOrFail($id);
        $thread->update(['is_locked' => true]);
        return response()->json(['message' => 'Thread locked', 'thread' => $thread->fresh()]);
    }

    /**
     * Unlock a thread
     */
    public function unlockThread($id)
    {
        $thread = ForumThread::findOrFail($id);
        $thread->update(['is_locked' => false]);
        return response()->json(['message' => 'Thread unlocked', 'thread' => $thread->fresh()]);
    }

    /**
     * Pin/Sticky a thread
     */
    public function stickyThread($id)
    {
        $thread = ForumThread::findOrFail($id);
        $thread->update(['is_pinned' => true]);
        return response()->json(['message' => 'Thread pinned', 'thread' => $thread->fresh()]);
    }

    /**
     * Unpin a thread
     */
    public function unstickyThread($id)
    {
        $thread = ForumThread::findOrFail($id);
        $thread->update(['is_pinned' => false]);
        return response()->json(['message' => 'Thread unpinned', 'thread' => $thread->fresh()]);
    }

    /**
     * Delete a post
     */
    public function deletePost($id)
    {
        $post = ForumPost::findOrFail($id);
        $threadId = $post->forum_thread_id;
        $post->delete();

        // Update thread post count
        $thread = ForumThread::find($threadId);
        if ($thread) {
            $thread->post_count = $thread->posts()->count();
            $lastPost = $thread->posts()->latest()->first();
            $thread->last_post_id = $lastPost?->id;
            $thread->last_post_at = $lastPost?->created_at;
            $thread->save();
        }

        return response()->json(['message' => 'Post deleted']);
    }

    /**
     * List all reports
     */
    public function listReports(Request $request)
    {
        $status = $request->get('status', 'all'); // all, pending, resolved
        $query = ForumPostReport::with(['post', 'post.thread', 'user', 'reviewer'])
            ->orderByDesc('created_at');

        if ($status === 'pending') {
            $query->whereNull('reviewed_at');
        } elseif ($status === 'resolved') {
            $query->whereNotNull('reviewed_at');
        }

        $reports = $query->paginate(50);

        return response()->json($reports);
    }

    /**
     * Resolve a report
     */
    public function resolveReport($id, Request $request)
    {
        $report = ForumPostReport::findOrFail($id);
        $action = $request->get('action', 'dismiss'); // dismiss, delete_post, ban_user

        $report->update([
            'status' => 'resolved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        if ($action === 'delete_post') {
            $report->post->delete();
        } elseif ($action === 'ban_user' && $report->post->user_id) {
            // Ban user logic would go here
        }

        return response()->json([
            'message' => 'Report resolved',
            'report' => $report->fresh(['reviewer']),
        ]);
    }
}

