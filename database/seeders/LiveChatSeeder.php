<?php

namespace Database\Seeders;

use App\Models\LiveChat;
use App\Models\LiveChatMessage;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class LiveChatSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::take(4)->get();

        if ($users->isEmpty()) {
            return;
        }

        foreach ($users as $index => $user) {
            $chat = LiveChat::create([
                'user_id' => $user->id,
                'last_message_at' => Carbon::now()->subMinutes(30 - ($index * 5)),
                'unread_admin_count' => $index % 2 === 0 ? 2 : 0,
            ]);

            $messages = [
                [
                    'sender_type' => 'user',
                    'message' => 'Hello, I need help with my recent order.',
                    'is_read' => $index % 2 !== 0,
                    'sent_at' => Carbon::now()->subMinutes(60),
                ],
                [
                    'sender_type' => 'admin',
                    'message' => 'Sure, could you please share your order ID?',
                    'is_read' => true,
                    'sent_at' => Carbon::now()->subMinutes(50),
                ],
                [
                    'sender_type' => 'user',
                    'message' => 'Order ID is #' . (1000 + $index),
                    'is_read' => $index % 2 !== 0,
                    'sent_at' => Carbon::now()->subMinutes(40),
                ],
            ];

            foreach ($messages as $message) {
                LiveChatMessage::create([
                    'live_chat_id' => $chat->id,
                    'sender_type' => $message['sender_type'],
                    'message' => $message['message'],
                    'is_read' => $message['is_read'],
                    'sent_at' => $message['sent_at'],
                ]);
            }
        }
    }
}
