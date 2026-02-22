<?php

namespace App\Http\Controllers;

use App\Models\AnalyticsEvent;
use App\Models\Order;
use App\Models\Transaction;
use App\Models\ForumThread;
use App\Models\ForumPost;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AnalyticsController extends Controller
{
    /**
     * Track an analytics event
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function track(Request $request)
    {
        try {
            $validated = $request->validate([
                'event_type' => 'required|string|max:255',
                'event_category' => 'nullable|string|max:255',
                'event_name' => 'required|string|max:255',
                'event_data' => 'nullable|array',
                'page_url' => 'nullable|string|max:500',
                'referrer' => 'nullable|string|max:500',
            ]);

            $user = Auth::guard('sanctum')->user();

            $event = AnalyticsEvent::create([
                'user_id' => $user?->id,
                'event_type' => $validated['event_type'],
                'event_category' => $validated['event_category'] ?? null,
                'event_name' => $validated['event_name'],
                'event_data' => $validated['event_data'] ?? null,
                'page_url' => $validated['page_url'] ?? $request->header('Referer'),
                'referrer' => $validated['referrer'] ?? $request->header('Referer'),
                'user_agent' => $request->header('User-Agent'),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'event_id' => $event->id,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to track analytics event', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to track event',
            ], 500);
        }
    }

    /**
     * Get user analytics summary
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function userSummary(Request $request)
    {
        try {
            $user = Auth::guard('sanctum')->user();

            if (!$user) {
                return response()->json([
                    'error' => 'Unauthorized',
                ], 401);
            }

            // Get user's sales (orders where user is seller)
            $mySales = Order::whereHas('ad', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('status', 'completed')
            ->sum('total');

            // Get user's orders (orders where user is buyer)
            $myOrders = Order::where('user_id', $user->id)
                ->where('status', 'completed')
                ->count();

            // Get wallet transactions
            $walletIn = Transaction::where('user_id', $user->id)
                ->where('type', 'deposit')
                ->where('status', 'completed')
                ->sum('amount');

            $walletOut = Transaction::where('user_id', $user->id)
                ->whereIn('type', ['withdraw', 'payment'])
                ->where('status', 'completed')
                ->sum('amount');

            // Get forum activity
            $forumThreads = ForumThread::where('user_id', $user->id)->count();
            $forumPosts = ForumPost::where('user_id', $user->id)->count();

            return response()->json([
                'my_sales' => (float) $mySales,
                'my_orders' => (int) $myOrders,
                'wallet_in' => (float) $walletIn,
                'wallet_out' => (float) $walletOut,
                'forum_threads' => (int) $forumThreads,
                'forum_posts' => (int) $forumPosts,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get user analytics summary', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to load analytics',
            ], 500);
        }
    }

    /**
     * Get admin analytics summary
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function adminSummary(Request $request)
    {
        try {
            $user = Auth::guard('sanctum')->user();

            if (!$user || !in_array($user->role, ['admin', 'super_admin'])) {
                return response()->json([
                    'error' => 'Unauthorized',
                ], 403);
            }

            // Get total sales (all completed orders)
            $sales = Order::where('status', 'completed')->sum('total');

            // Get total orders
            $orders = Order::where('status', 'completed')->count();

            // Get wallet transactions (all users)
            $walletIn = Transaction::where('type', 'deposit')
                ->where('status', 'completed')
                ->sum('amount');

            $walletOut = Transaction::whereIn('type', ['withdraw', 'payment'])
                ->where('status', 'completed')
                ->sum('amount');

            // Get forum activity (all users)
            $forumThreads = ForumThread::count();
            $forumPosts = ForumPost::count();

            // Get new users (last 30 days)
            $newUsers = User::where('created_at', '>=', now()->subDays(30))->count();

            return response()->json([
                'sales' => (float) $sales,
                'orders' => (int) $orders,
                'wallet_in' => (float) $walletIn,
                'wallet_out' => (float) $walletOut,
                'forum_threads' => (int) $forumThreads,
                'forum_posts' => (int) $forumPosts,
                'new_users' => (int) $newUsers,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get admin analytics summary', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Failed to load analytics',
            ], 500);
        }
    }
}

