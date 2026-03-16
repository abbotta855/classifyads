<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LiveChat;
use App\Models\LiveChatMessage;
use App\Models\SupportOfflineMessage;
use App\Models\User;
use Illuminate\Http\Request;

class LiveChatController extends Controller
{
    /**
     * Display a listing of the resource.
     * Includes both live chats with registered users AND guest offline messages.
     */
    public function index()
    {
        // Get all live chats with registered users
        $chats = LiveChat::with('user')
            ->orderByDesc('unread_admin_count')
            ->orderByDesc('last_message_at')
            ->get();

        // Get guest offline messages (not yet converted to live chat)
        $guestOfflineMessages = SupportOfflineMessage::whereNull('user_id')
            ->whereNull('replied_at')
            ->orderByDesc('created_at')
            ->get();

        // Group guest messages by email address (so same guest appears as one chat)
        $guestMessagesByEmail = $guestOfflineMessages->groupBy('guest_email');

        // Transform grouped guest messages into chat-like structure
        $guestChats = $guestMessagesByEmail->map(function ($messages, $email) {
            // Get the most recent message for this email
            $latestMessage = $messages->sortByDesc('created_at')->first();
            
            // Count unread messages for this guest
            $unreadCount = $messages->where('is_read', false)->count();
            
            return [
                'id' => 'guest_email_' . md5($email), // Use email hash as unique ID
                'is_guest' => true,
                'guest_name' => $latestMessage->guest_name,
                'guest_email' => $email,
                'user' => null,
                'user_id' => null,
                'unread_admin_count' => $unreadCount,
                'last_message_at' => $latestMessage->created_at,
                'last_message' => $latestMessage->message,
                'offline_message_ids' => $messages->pluck('id')->toArray(), // All message IDs for this guest
                'message_count' => $messages->count(), // Total messages from this guest
            ];
        })->values();

        // Combine live chats and guest messages, sorted by last message time
        $allChats = $chats->toArray();
        foreach ($guestChats as $guestChat) {
            $allChats[] = $guestChat;
        }

        // Sort by last_message_at descending
        usort($allChats, function ($a, $b) {
            $timeA = is_string($a['last_message_at']) ? strtotime($a['last_message_at']) : (is_object($a['last_message_at']) ? $a['last_message_at']->timestamp : 0);
            $timeB = is_string($b['last_message_at']) ? strtotime($b['last_message_at']) : (is_object($b['last_message_at']) ? $b['last_message_at']->timestamp : 0);
            return $timeB <=> $timeA;
        });

        return response()->json($allChats);
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
     * Handles both regular live chats and guest offline messages (grouped by email).
     */
    public function show(string $id)
    {
        // Check if this is a guest chat (prefixed with 'guest_email_')
        if (str_starts_with($id, 'guest_email_')) {
            // Extract email hash from ID
            $emailHash = str_replace('guest_email_', '', $id);
            
            // Find all guest messages with this email (find one to get email, then get all)
            $sampleMessage = SupportOfflineMessage::whereNull('user_id')
                ->whereNull('replied_at')
                ->get()
                ->firstWhere(function ($msg) use ($emailHash) {
                    return md5($msg->guest_email) === $emailHash;
                });

            if (!$sampleMessage) {
                abort(404, 'Guest chat not found');
            }

            // Get ALL messages from this guest email
            $guestMessages = SupportOfflineMessage::whereNull('user_id')
                ->where('guest_email', $sampleMessage->guest_email)
                ->whereNull('replied_at')
                ->orderBy('created_at', 'asc')
                ->get();

            // Transform messages to chat format
            $messages = $guestMessages->map(function ($msg) {
                return [
                    'id' => 'offline_' . $msg->id,
                    'sender_type' => 'user',
                    'message' => $msg->message,
                    'is_read' => $msg->is_read,
                    'sent_at' => $msg->created_at,
                    'guest_name' => $msg->guest_name,
                ];
            });

            // Get the most recent message for metadata
            $latestMessage = $guestMessages->sortByDesc('created_at')->first();

            return response()->json([
                'id' => $id,
                'is_guest' => true,
                'guest_name' => $latestMessage->guest_name,
                'guest_email' => $sampleMessage->guest_email,
                'user' => null,
                'user_id' => null,
                'messages' => $messages->toArray(),
                'offline_message_ids' => $guestMessages->pluck('id')->toArray(),
                'message_count' => $guestMessages->count(),
            ]);
        }
        
        // Legacy support for old 'guest_' prefix (single message)
        if (str_starts_with($id, 'guest_')) {
            $offlineMessageId = str_replace('guest_', '', $id);
            $offlineMessage = SupportOfflineMessage::findOrFail($offlineMessageId);

            // Get all messages from this guest email
            $guestMessages = SupportOfflineMessage::whereNull('user_id')
                ->where('guest_email', $offlineMessage->guest_email)
                ->whereNull('replied_at')
                ->orderBy('created_at', 'asc')
                ->get();

            $messages = $guestMessages->map(function ($msg) {
                return [
                    'id' => 'offline_' . $msg->id,
                    'sender_type' => 'user',
                    'message' => $msg->message,
                    'is_read' => $msg->is_read,
                    'sent_at' => $msg->created_at,
                    'guest_name' => $msg->guest_name,
                ];
            });

            return response()->json([
                'id' => 'guest_email_' . md5($offlineMessage->guest_email),
                'is_guest' => true,
                'guest_name' => $offlineMessage->guest_name,
                'guest_email' => $offlineMessage->guest_email,
                'user' => null,
                'user_id' => null,
                'messages' => $messages->toArray(),
                'offline_message_ids' => $guestMessages->pluck('id')->toArray(),
            ]);
        }

        // Regular live chat with registered user
        $chat = LiveChat::with(['user', 'messages' => function ($query) {
            $query->orderBy('sent_at', 'asc');
        }])->findOrFail($id);

        // Convert any pending offline messages for this user to live chat messages
        if ($chat->user) {
            // Get offline messages by user_id OR by matching email (for guest messages)
            $offlineMessages = SupportOfflineMessage::where(function ($query) use ($chat) {
                $query->where('user_id', $chat->user_id)
                    ->orWhere('guest_email', $chat->user->email);
            })
                ->whereNull('replied_at')
                ->orderBy('created_at', 'asc')
                ->get();

            foreach ($offlineMessages as $offlineMsg) {
                // Check if this offline message was already converted
                $exists = LiveChatMessage::where('live_chat_id', $chat->id)
                    ->where('message', $offlineMsg->message)
                    ->where('sent_at', $offlineMsg->created_at)
                    ->exists();

                if (!$exists) {
                    // Convert offline message to live chat message
                    LiveChatMessage::create([
                        'live_chat_id' => $chat->id,
                        'sender_type' => 'user',
                        'message' => $offlineMsg->message,
                        'is_read' => false,
                        'sent_at' => $offlineMsg->created_at,
                    ]);

                    // Mark offline message as replied (converted to live chat)
                    $offlineMsg->update(['replied_at' => now()]);

                    // Update chat metadata
                    $chat->increment('unread_admin_count');
                    $chat->update(['last_message_at' => $offlineMsg->created_at]);
                }
            }

            // Reload chat with updated messages
            $chat->load(['messages' => function ($query) {
                $query->orderBy('sent_at', 'asc');
            }]);
        }

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
