<?php

namespace App\Http\Controllers;

use App\Models\LiveChat;
use App\Models\LiveChatMessage;
use Illuminate\Http\Request;

class UserLiveChatController extends Controller
{
    /**
     * Get all chats for the authenticated user
     */
    public function index(Request $request)
    {
        $chats = LiveChat::where('user_id', $request->user()->id)
            ->with(['messages' => function ($query) {
                $query->orderBy('sent_at', 'desc')->limit(1);
            }])
            ->orderByDesc('last_message_at')
            ->get();

        // Get unread count for each chat
        foreach ($chats as $chat) {
            $chat->unread_count = $chat->messages()
                ->where('sender_type', 'admin')
                ->where('is_read', false)
                ->count();
        }

        return response()->json($chats);
    }

    /**
     * Get a specific chat with all messages
     */
    public function show(Request $request, $id)
    {
        $chat = LiveChat::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->with(['messages' => function ($query) {
                $query->orderBy('sent_at', 'asc');
            }])
            ->firstOrFail();

        // Mark admin messages as read
        $chat->messages()
            ->where('sender_type', 'admin')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json($chat);
    }

    /**
     * Send a message in a chat
     */
    public function sendMessage(Request $request, $id)
    {
        $chat = LiveChat::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'message' => 'required|string|max:5000',
        ]);

        $message = $chat->messages()->create([
            'sender_type' => 'user',
            'message' => $validated['message'],
            'is_read' => false,
            'sent_at' => now(),
        ]);

        $chat->update([
            'last_message_at' => now(),
            'unread_admin_count' => $chat->unread_admin_count + 1,
        ]);

        return response()->json($message, 201);
    }

    /**
     * Create a new chat
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Check if user already has an active chat
        $existingChat = LiveChat::where('user_id', $user->id)
            ->orderByDesc('last_message_at')
            ->first();

        if ($existingChat) {
            return response()->json([
                'message' => 'Using existing chat',
                'chat' => $existingChat,
            ]);
        }

        $chat = LiveChat::create([
            'user_id' => $user->id,
            'last_message_at' => now(),
            'unread_admin_count' => 0,
        ]);

        return response()->json($chat, 201);
    }
}

