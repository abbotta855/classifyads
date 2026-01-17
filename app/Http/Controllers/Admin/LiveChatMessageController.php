<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LiveChat;
use App\Models\LiveChatMessage;
use App\Models\SupportOfflineMessage;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class LiveChatMessageController extends Controller
{
    public function index(Request $request, $liveChatId)
    {
        // Check if this is a guest chat (prefixed with 'guest_email_')
        if (str_starts_with($liveChatId, 'guest_email_')) {
            $emailHash = str_replace('guest_email_', '', $liveChatId);
            
            // Find all messages with this email hash
            $sampleMessage = SupportOfflineMessage::whereNull('user_id')
                ->whereNull('replied_at')
                ->get()
                ->firstWhere(function ($msg) use ($emailHash) {
                    return md5($msg->guest_email) === $emailHash;
                });

            if (!$sampleMessage) {
                return response()->json([]);
            }

            $guestMessages = SupportOfflineMessage::whereNull('user_id')
                ->where('guest_email', $sampleMessage->guest_email)
                ->whereNull('replied_at')
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json($guestMessages->map(function ($msg) {
                return [
                    'id' => 'offline_' . $msg->id,
                    'sender_type' => 'user',
                    'message' => $msg->message,
                    'is_read' => $msg->is_read,
                    'sent_at' => $msg->created_at,
                    'guest_name' => $msg->guest_name,
                ];
            }));
        }
        
        // Legacy support for old 'guest_' prefix
        if (str_starts_with($liveChatId, 'guest_')) {
            $offlineMessageId = str_replace('guest_', '', $liveChatId);
            $offlineMessage = SupportOfflineMessage::findOrFail($offlineMessageId);

            // Get all messages from this guest email
            $guestMessages = SupportOfflineMessage::whereNull('user_id')
                ->where('guest_email', $offlineMessage->guest_email)
                ->whereNull('replied_at')
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json($guestMessages->map(function ($msg) {
                return [
                    'id' => 'offline_' . $msg->id,
                    'sender_type' => 'user',
                    'message' => $msg->message,
                    'is_read' => $msg->is_read,
                    'sent_at' => $msg->created_at,
                    'guest_name' => $msg->guest_name,
                ];
            }));
        }

        // Regular live chat
        $liveChat = LiveChat::findOrFail($liveChatId);
        $messages = $liveChat->messages()
            ->orderBy('sent_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    public function store(Request $request, $liveChatId)
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'sender_type' => 'nullable|in:user,admin',
        ]);

        $senderType = $validated['sender_type'] ?? 'admin';

        // Check if this is a guest chat (prefixed with 'guest_email_')
        if (str_starts_with($liveChatId, 'guest_email_')) {
            $emailHash = str_replace('guest_email_', '', $liveChatId);
            
            // Find all messages with this email hash
            $sampleMessage = SupportOfflineMessage::whereNull('user_id')
                ->whereNull('replied_at')
                ->get()
                ->firstWhere(function ($msg) use ($emailHash) {
                    return md5($msg->guest_email) === $emailHash;
                });

            if (!$sampleMessage) {
                abort(404, 'Guest chat not found');
            }

            // Mark ALL offline messages from this email as replied
            $affected = SupportOfflineMessage::whereNull('user_id')
                ->where('guest_email', $sampleMessage->guest_email)
                ->whereNull('replied_at')
                ->update([
                    'replied_at' => now(),
                    'is_read' => true,
                ]);
            
            $guestEmail = $sampleMessage->guest_email;
            $guestName = $sampleMessage->guest_name;
        }
        // Legacy support for old 'guest_' prefix
        elseif (str_starts_with($liveChatId, 'guest_')) {
            $offlineMessageId = str_replace('guest_', '', $liveChatId);
            $offlineMessage = SupportOfflineMessage::findOrFail($offlineMessageId);

            // Mark ALL messages from this guest email as replied
            $affected = SupportOfflineMessage::whereNull('user_id')
                ->where('guest_email', $offlineMessage->guest_email)
                ->whereNull('replied_at')
                ->update([
                    'replied_at' => now(),
                    'is_read' => true,
                ]);
            
            $guestEmail = $offlineMessage->guest_email;
            $guestName = $offlineMessage->guest_name;
        }
        
        // Handle guest reply email sending
        if (isset($guestEmail)) {

            // Get the first/oldest message for context in email
            $firstMessage = SupportOfflineMessage::where('guest_email', $guestEmail)
                ->orderBy('created_at', 'asc')
                ->first();
            
            // Send email reply to guest
            try {
                Mail::send('emails.support-reply', [
                    'guestName' => $guestName,
                    'originalMessage' => $firstMessage->message ?? 'Your support request',
                    'replyMessage' => $validated['message'],
                ], function ($message) use ($guestEmail, $guestName) {
                    $message->to($guestEmail)
                        ->subject('Re: ' . ($guestName ? 'Your Support Request' : 'Support Request'));
                });
            } catch (\Exception $e) {
                \Log::error('Failed to send email reply to guest: ' . $e->getMessage());
                // Continue anyway - message is marked as replied
            }

            return response()->json([
                'id' => 'guest_reply_' . time(),
                'sender_type' => 'admin',
                'message' => $validated['message'],
                'is_read' => true,
                'sent_at' => now(),
                'is_guest_reply' => true,
            ], 201);
        }

        // Regular live chat with registered user
        $liveChat = LiveChat::findOrFail($liveChatId);

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

    public function markAsRead(Request $request, $liveChatId)
    {
        // Check if this is a guest chat (prefixed with 'guest_email_')
        if (str_starts_with($liveChatId, 'guest_email_')) {
            $emailHash = str_replace('guest_email_', '', $liveChatId);
            
            // Find all messages with this email hash
            $sampleMessage = SupportOfflineMessage::whereNull('user_id')
                ->whereNull('replied_at')
                ->get()
                ->firstWhere(function ($msg) use ($emailHash) {
                    return md5($msg->guest_email) === $emailHash;
                });

            if ($sampleMessage) {
                // Mark ALL messages from this guest email as read
                SupportOfflineMessage::whereNull('user_id')
                    ->where('guest_email', $sampleMessage->guest_email)
                    ->whereNull('replied_at')
                    ->update(['is_read' => true]);
            }
            
            return response()->json(['message' => 'Guest messages marked as read']);
        }
        
        // Legacy support for old 'guest_' prefix
        if (str_starts_with($liveChatId, 'guest_')) {
            $offlineMessageId = str_replace('guest_', '', $liveChatId);
            $offlineMessage = SupportOfflineMessage::findOrFail($offlineMessageId);
            
            // Mark ALL messages from this guest email as read
            SupportOfflineMessage::whereNull('user_id')
                ->where('guest_email', $offlineMessage->guest_email)
                ->whereNull('replied_at')
                ->update(['is_read' => true]);
            
            return response()->json(['message' => 'Guest messages marked as read']);
        }

        // Regular live chat
        $liveChat = LiveChat::findOrFail($liveChatId);
        $liveChat->messages()
            ->where('sender_type', 'user')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $liveChat->update(['unread_admin_count' => 0]);

        return response()->json(['message' => 'Chat marked as read']);
    }
}
