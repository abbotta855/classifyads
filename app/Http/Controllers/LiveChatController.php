<?php

namespace App\Http\Controllers;

use App\Models\LiveChat;
use App\Models\LiveChatMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LiveChatController extends Controller
{
    /**
     * Create or return the user's live chat conversation
     */
    public function createOrGetChat(Request $request)
    {
        $user = $request->user();

        $chat = LiveChat::firstOrCreate(
            ['user_id' => $user->id],
            [
                'last_message_at' => now(),
                'unread_admin_count' => 0,
            ]
        );

        return response()->json($chat);
    }

    /**
     * Get the user's chat with messages
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $chat = LiveChat::with(['messages' => function ($query) {
            $query->orderBy('sent_at', 'asc');
        }])->where('user_id', $user->id)->first();

        if (!$chat) {
            return response()->json(['message' => 'No chat found'], 404);
        }

        return response()->json($chat);
    }

    /**
     * Send a message from user to admin
     */
    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string',
        ]);

        $user = $request->user();
        $chat = LiveChat::firstOrCreate(
            ['user_id' => $user->id],
            [
                'last_message_at' => now(),
                'unread_admin_count' => 0,
            ]
        );

        $message = $chat->messages()->create([
            'sender_type' => 'user',
            'message' => $validated['message'],
            'is_read' => false,
            'sent_at' => now(),
        ]);

        // Increment unread for admin
        $chat->increment('unread_admin_count');
        $chat->update(['last_message_at' => $message->sent_at]);

        return response()->json($message, 201);
    }

    /**
     * Mark all admin messages as read for this user
     */
    public function markRead(Request $request)
    {
        $user = $request->user();
        $chat = LiveChat::where('user_id', $user->id)->first();

        if (!$chat) {
            return response()->json(['message' => 'No chat found'], 404);
        }

        $chat->messages()
            ->where('sender_type', 'admin')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Marked as read']);
    }
}


