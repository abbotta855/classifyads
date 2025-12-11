<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LiveChat;
use App\Models\LiveChatMessage;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class LiveChatMessageController extends Controller
{
    public function index(LiveChat $liveChat)
    {
        $messages = $liveChat->messages()
            ->orderBy('sent_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    public function store(Request $request, LiveChat $liveChat)
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'sender_type' => 'nullable|in:user,admin',
        ]);

        $senderType = $validated['sender_type'] ?? 'admin';

        $message = $liveChat->messages()->create([
            'sender_type' => $senderType,
            'message' => $validated['message'],
            'is_read' => $senderType === 'admin',
            'sent_at' => now(),
        ]);

        if ($senderType === 'user') {
            $liveChat->increment('unread_admin_count');
        } else {
            // Admin sent message - create notification for user
            $liveChat->update(['unread_admin_count' => 0]);
            
            // Create notification for the user
            try {
                UserNotification::create([
                    'user_id' => $liveChat->user_id,
                    'type' => 'new_message',
                    'title' => 'New Message from Support',
                    'message' => 'You have a new message from the support team',
                    'is_read' => false,
                    'link' => '/user_dashboard/inbox',
                    'metadata' => [
                        'chat_id' => $liveChat->id,
                        'message_id' => $message->id,
                        'sender_type' => 'admin',
                    ],
                ]);
            } catch (\Exception $e) {
                // Log error but don't fail message creation
                \Log::error('Failed to create notification for support message: ' . $e->getMessage(), [
                    'chat_id' => $liveChat->id,
                    'user_id' => $liveChat->user_id,
                    'exception' => $e
                ]);
            }
        }

        $liveChat->update(['last_message_at' => $message->sent_at]);

        return response()->json($message, 201);
    }

    public function markAsRead(LiveChat $liveChat)
    {
        $liveChat->messages()
            ->where('sender_type', 'user')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $liveChat->update(['unread_admin_count' => 0]);

        return response()->json(['message' => 'Chat marked as read']);
    }
}
