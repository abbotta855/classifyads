<?php

namespace App\Http\Controllers;

use App\Models\BuyerSellerMessage;
use App\Models\Ad;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class BuyerSellerMessageController extends Controller
{
    /**
     * Get messages for a specific ad conversation
     */
    public function getConversation(Request $request, $adId)
    {
        $user = $request->user();
        $ad = Ad::findOrFail($adId);

        // Buyer can see messages if they're the buyer
        // Seller can see all messages for their ad
        $messages = BuyerSellerMessage::where('ad_id', $adId)
            ->where(function ($query) use ($user, $ad) {
                if ($user->id === $ad->user_id) {
                    // Seller viewing all conversations for their ad
                    $query->where('seller_id', $user->id);
                } else {
                    // Buyer viewing their conversation with the seller
                    $query->where('buyer_id', $user->id)
                          ->where('seller_id', $ad->user_id);
                }
            })
            ->with(['buyer', 'seller'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark messages as read if viewing as seller
        if ($user->id === $ad->user_id) {
            BuyerSellerMessage::where('ad_id', $adId)
                ->where('seller_id', $user->id)
                ->where('sender_type', 'buyer')
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);
        }

        return response()->json($messages);
    }

    /**
     * Send a message (buyer or seller)
     */
    public function sendMessage(Request $request, $adId)
    {
        $user = $request->user();
        $ad = Ad::findOrFail($adId);

        $validated = $request->validate([
            'message' => 'required|string|max:5000',
            'sender_type' => 'required|in:buyer,seller',
        ]);

        // Verify sender type matches user role
        if ($validated['sender_type'] === 'buyer' && $user->id === $ad->user_id) {
            return response()->json(['error' => 'Sellers cannot send messages as buyers'], 400);
        }
        if ($validated['sender_type'] === 'seller' && $user->id !== $ad->user_id) {
            return response()->json(['error' => 'Only the seller can send messages as seller'], 400);
        }

        $buyerId = $validated['sender_type'] === 'buyer' ? $user->id : null;
        $sellerId = $ad->user_id;

        // For seller messages, we need to determine which buyer they're responding to
        // Get the most recent buyer message for this ad to determine the conversation
        if ($validated['sender_type'] === 'seller') {
            $lastBuyerMessage = BuyerSellerMessage::where('ad_id', $ad->id)
                ->where('sender_type', 'buyer')
                ->orderBy('created_at', 'desc')
                ->first();
            
            if ($lastBuyerMessage) {
                $buyerId = $lastBuyerMessage->buyer_id;
            } else {
                // If no buyer message exists, we can't create a seller response
                return response()->json(['error' => 'No buyer message found to respond to'], 400);
            }
        }

        $message = BuyerSellerMessage::create([
            'ad_id' => $ad->id,
            'buyer_id' => $buyerId,
            'seller_id' => $sellerId,
            'sender_type' => $validated['sender_type'],
            'message' => $validated['message'],
            'is_read' => $validated['sender_type'] === 'seller', // Seller messages are auto-read
        ]);

        // Create notification for the recipient
        if ($validated['sender_type'] === 'buyer') {
            // Buyer sent message - notify seller
            $senderName = $user->name ?? 'A buyer';
            UserNotification::create([
                'user_id' => $sellerId,
                'type' => 'new_message',
                'title' => 'New Message',
                'message' => $senderName . ' sent you a message about "' . $ad->title . '"',
                'is_read' => false,
                'related_ad_id' => $ad->id,
                'link' => '/user_dashboard/inbox',
                'metadata' => [
                    'ad_id' => $ad->id,
                    'ad_title' => $ad->title,
                    'sender_id' => $user->id,
                    'sender_name' => $senderName,
                    'message_id' => $message->id,
                ],
            ]);
        } else {
            // Seller sent message - notify buyer
            $senderName = $user->name ?? 'The seller';
            UserNotification::create([
                'user_id' => $buyerId,
                'type' => 'new_message',
                'title' => 'New Message',
                'message' => $senderName . ' replied to your message about "' . $ad->title . '"',
                'is_read' => false,
                'related_ad_id' => $ad->id,
                'link' => '/user_dashboard/inbox',
                'metadata' => [
                    'ad_id' => $ad->id,
                    'ad_title' => $ad->title,
                    'sender_id' => $user->id,
                    'sender_name' => $senderName,
                    'message_id' => $message->id,
                ],
            ]);
        }

        return response()->json($message->load(['buyer', 'seller']), 201);
    }

    /**
     * Get all conversations for a seller (all their ads with messages)
     */
    public function getSellerConversations(Request $request)
    {
        $user = $request->user();

        // Get all ads by this seller that have messages
        $ads = Ad::where('user_id', $user->id)
            ->whereHas('buyerSellerMessages')
            ->with(['buyerSellerMessages' => function ($query) {
                $query->orderBy('created_at', 'desc')->limit(1);
            }])
            ->get()
            ->map(function ($ad) use ($user) {
                $unreadCount = BuyerSellerMessage::where('ad_id', $ad->id)
                    ->where('seller_id', $ad->user_id)
                    ->where('sender_type', 'buyer')
                    ->where('is_read', false)
                    ->count();

                // Get unique buyers for this ad
                $buyers = BuyerSellerMessage::where('ad_id', $ad->id)
                    ->where('sender_type', 'buyer')
                    ->distinct('buyer_id')
                    ->with('buyer')
                    ->get()
                    ->pluck('buyer')
                    ->unique('id')
                    ->values();

                $lastMessage = $ad->buyerSellerMessages->first();

                $firstBuyer = $buyers->first();
                return [
                    'ad_id' => $ad->id,
                    'ad_title' => $ad->title,
                    'seller_id' => $user->id,
                    'last_message' => $lastMessage,
                    'last_message_at' => $lastMessage ? $lastMessage->created_at : null,
                    'unread_count' => $unreadCount,
                    'other_party_name' => $firstBuyer ? $firstBuyer->name : 'Buyer',
                ];
            });

        return response()->json($ads);
    }

    /**
     * Get all conversations for a buyer (all ads they've messaged about)
     */
    public function getBuyerConversations(Request $request)
    {
        $user = $request->user();

        // Get all ads this buyer has messaged about
        $adIds = BuyerSellerMessage::where('buyer_id', $user->id)
            ->distinct()
            ->pluck('ad_id');

        $ads = Ad::whereIn('id', $adIds)
            ->with(['buyerSellerMessages' => function ($query) use ($user) {
                $query->where('buyer_id', $user->id)
                    ->orderBy('created_at', 'desc')
                    ->limit(1);
            }, 'user'])
            ->get()
            ->map(function ($ad) use ($user) {
                $unreadCount = BuyerSellerMessage::where('ad_id', $ad->id)
                    ->where('buyer_id', $user->id)
                    ->where('sender_type', 'seller')
                    ->where('is_read', false)
                    ->count();

                $lastMessage = $ad->buyerSellerMessages->first();

                return [
                    'ad_id' => $ad->id,
                    'ad_title' => $ad->title,
                    'seller_id' => $ad->user_id,
                    'seller_name' => $ad->user->name ?? 'Unknown',
                    'other_party_name' => $ad->user->name ?? 'Seller',
                    'last_message' => $lastMessage,
                    'last_message_at' => $lastMessage ? $lastMessage->created_at : null,
                    'unread_count' => $unreadCount,
                ];
            });

        return response()->json($ads);
    }
}
