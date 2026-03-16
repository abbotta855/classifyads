<?php

namespace App\Http\Controllers;

use App\Models\SupportOfflineMessage;
use App\Models\LiveChat;
use App\Models\LiveChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupportOfflineMessageController extends Controller
{
    /**
     * Store a new offline support message (public - guest or authenticated user)
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user) {
            // Authenticated user
            $validated = $request->validate([
                'message' => 'required|string|max:5000',
            ]);

            $message = SupportOfflineMessage::create([
                'user_id' => $user->id,
                'message' => $validated['message'],
            ]);
        } else {
            // Guest user - requires email
            $validated = $request->validate([
                'name' => 'nullable|string|max:255',
                'email' => 'required|email|max:255',
                'message' => 'required|string|max:5000',
            ]);

            $guestEmail = $validated['email'];
            $guestName = $validated['name'] ?? 'Guest';

            // Check if this email is already registered to avoid user duplication
            // If email exists, convert message to LiveChat immediately instead of creating offline message
            $existingUser = User::where('email', $guestEmail)->first();

            if ($existingUser) {
                // Email is already registered - convert to LiveChat immediately (prevents duplication)
                // This ensures registered users' messages go directly to their LiveChat
                // Create or get existing LiveChat for this user (prevents duplicate LiveChats)
                $liveChat = LiveChat::firstOrCreate(
                    ['user_id' => $existingUser->id],
                    [
                        'last_message_at' => now(),
                        'unread_admin_count' => 0,
                    ]
                );

                // Check if this exact message already exists to prevent duplicates
                $existingMessage = LiveChatMessage::where('live_chat_id', $liveChat->id)
                    ->where('message', $validated['message'])
                    ->where('sender_type', 'user')
                    ->where('sent_at', '>=', now()->subMinutes(1)) // Within last minute
                    ->first();

                if ($existingMessage) {
                    // Message already exists - return existing message
                    return response()->json([
                        'message' => 'Your message has already been sent.',
                        'data' => $existingMessage,
                        'converted_to_live_chat' => true,
                        'live_chat_id' => $liveChat->id,
                    ], 200);
                }

                // Create LiveChatMessage directly (skip offline message)
                $liveChatMessage = LiveChatMessage::create([
                    'live_chat_id' => $liveChat->id,
                    'sender_type' => 'user',
                    'message' => $validated['message'],
                    'is_read' => false, // Admin hasn't read yet
                    'sent_at' => now(),
                ]);

                // Update LiveChat metadata
                $liveChat->update([
                    'last_message_at' => now(),
                    'unread_admin_count' => $liveChat->messages()
                        ->where('sender_type', 'user')
                        ->where('is_read', false)
                        ->count(),
                ]);

                // Also create offline message record for tracking (linked to user)
                // This helps with admin panel display and message history
                $message = SupportOfflineMessage::create([
                    'user_id' => $existingUser->id, // Link to existing user (prevents duplication)
                    'guest_name' => $guestName,
                    'guest_email' => $guestEmail,
                    'message' => $validated['message'],
                    'is_read' => false,
                    'replied_at' => null, // Not replied yet
                ]);

                return response()->json([
                    'message' => 'Your message has been sent to live chat. We will reply as soon as possible.',
                    'data' => $message,
                    'converted_to_live_chat' => true,
                    'live_chat_id' => $liveChat->id,
                ], 201);
            } else {
                // Email not registered - create offline message as guest
                // Will be converted to LiveChat when user registers with this email
                $message = SupportOfflineMessage::create([
                    'guest_name' => $guestName,
                    'guest_email' => $guestEmail,
                    'message' => $validated['message'],
                ]);
            }
        }

        return response()->json([
            'message' => 'Your message has been sent. We will reply as soon as possible.',
            'data' => $message,
        ], 201);
    }

    /**
     * List offline messages (admin only)
     */
    public function index(Request $request)
    {
        $messages = SupportOfflineMessage::with('user')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($messages);
    }

    /**
     * Get a specific offline message (admin only)
     */
    public function show(string $id)
    {
        $message = SupportOfflineMessage::with('user')->findOrFail($id);
        return response()->json($message);
    }

    /**
     * Mark message as read (admin only)
     */
    public function markAsRead(string $id)
    {
        $message = SupportOfflineMessage::findOrFail($id);
        $message->update(['is_read' => true]);

        return response()->json($message);
    }
}

