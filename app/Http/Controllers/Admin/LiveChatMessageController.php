<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LiveChat;
use App\Models\LiveChatMessage;
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
            $liveChat->update(['unread_admin_count' => 0]);
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
