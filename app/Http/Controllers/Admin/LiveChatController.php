<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LiveChat;
use App\Models\User;
use Illuminate\Http\Request;

class LiveChatController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $chats = LiveChat::with('user')
            ->orderByDesc('unread_admin_count')
            ->orderByDesc('last_message_at')
            ->get();

        return response()->json($chats);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $chat = LiveChat::create([
            'user_id' => $validated['user_id'],
            'last_message_at' => now(),
            'unread_admin_count' => 0,
        ]);

        return response()->json($chat, 201);
    }

    /**
     * Admin: get or create a chat for a specific user.
     */
    public function open(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $chat = LiveChat::firstOrCreate(
            ['user_id' => $validated['user_id']],
            [
                'last_message_at' => now(),
                'unread_admin_count' => 0,
            ]
        );

        return response()->json($chat);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $chat = LiveChat::with(['user', 'messages' => function ($query) {
            $query->orderBy('sent_at', 'asc');
        }])->findOrFail($id);

        return response()->json($chat);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $chat = LiveChat::findOrFail($id);

        $validated = $request->validate([
            'unread_admin_count' => 'sometimes|integer|min:0',
        ]);

        $chat->update($validated);

        return response()->json($chat);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $chat = LiveChat::findOrFail($id);
        $chat->delete();

        return response()->json(['message' => 'Live chat deleted successfully']);
    }
}
