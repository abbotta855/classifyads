<?php

namespace App\Http\Controllers;

use App\Models\BuyerSellerMessage;
use App\Models\Ad;
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
            ->map(function ($ad) {
                $unreadCount = BuyerSellerMessage::where('ad_id', $ad->id)
                    ->where('seller_id', $ad->user_id)
                    ->where('sender_type', 'buyer')
                    ->where('is_read', false)
                    ->count();

                return [
                    'ad_id' => $ad->id,
                    'ad_title' => $ad->title,
                    'last_message' => $ad->buyerSellerMessages->first(),
                    'unread_count' => $unreadCount,
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
            }])
            ->get()
            ->map(function ($ad) use ($user) {
                $unreadCount = BuyerSellerMessage::where('ad_id', $ad->id)
                    ->where('buyer_id', $user->id)
                    ->where('sender_type', 'seller')
                    ->where('is_read', false)
                    ->count();

                return [
                    'ad_id' => $ad->id,
                    'ad_title' => $ad->title,
                    'seller_name' => $ad->user->name ?? 'Unknown',
                    'last_message' => $ad->buyerSellerMessages->first(),
                    'unread_count' => $unreadCount,
                ];
            });

        return response()->json($ads);
    }
}
