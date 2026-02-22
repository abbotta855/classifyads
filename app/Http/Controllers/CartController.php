<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use App\Models\Cart;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * Get user's cart
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['items' => [], 'count' => 0]);
        }

        $cartItems = Cart::with(['ad.photos'])
            ->where('user_id', $user->id)
            ->get();

        // Enrich cart items with ad data
        $enrichedCart = [];
        foreach ($cartItems as $item) {
            $ad = $item->ad;
            if ($ad && $ad->status === 'approved') {
                $enrichedCart[] = [
                    'id' => $item->id,
                    'ad_id' => $ad->id,
                    'title' => $ad->title,
                    'price' => (float) $item->price,
                    'quantity' => (int) $item->quantity,
                    'total' => (float) $item->price * (int) $item->quantity,
                    'image' => $ad->photos->first()?->photo_url,
                    'slug' => $ad->slug,
                ];
            }
        }

        return response()->json([
            'items' => $enrichedCart,
            'count' => count($enrichedCart),
        ]);
    }

    /**
     * Add item to cart
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $validated = $request->validate([
            'ad_id' => 'required|exists:ads,id',
            'quantity' => 'integer|min:1|max:100',
        ]);

        $ad = Ad::findOrFail($validated['ad_id']);
        if ($ad->status !== 'approved') {
            return response()->json(['error' => 'Product not available'], 400);
        }

        $quantity = $validated['quantity'] ?? 1;

        // Check if item already exists
        $cartItem = Cart::where('user_id', $user->id)
            ->where('ad_id', $validated['ad_id'])
            ->first();

        if ($cartItem) {
            // Update quantity
            $cartItem->quantity += $quantity;
            $cartItem->save();
        } else {
            // Create new item
            $cartItem = Cart::create([
                'user_id' => $user->id,
                'ad_id' => $validated['ad_id'],
                'quantity' => $quantity,
                'price' => $ad->price,
            ]);
        }

        return response()->json([
            'message' => 'Item added to cart',
            'item' => $cartItem->load('ad'),
        ]);
    }

    /**
     * Update cart item quantity
     */
    public function update(Request $request, $adId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1|max:100',
        ]);

        $cartItem = Cart::where('user_id', $user->id)
            ->where('ad_id', $adId)
            ->firstOrFail();

        $cartItem->quantity = $validated['quantity'];
        $cartItem->save();

        return response()->json([
            'message' => 'Cart updated',
            'item' => $cartItem->load('ad'),
        ]);
    }

    /**
     * Remove item from cart
     */
    public function destroy(Request $request, $adId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $cartItem = Cart::where('user_id', $user->id)
            ->where('ad_id', $adId)
            ->firstOrFail();

        $cartItem->delete();

        return response()->json(['message' => 'Item removed from cart']);
    }

    /**
     * Clear cart
     */
    public function clear(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        Cart::where('user_id', $user->id)->delete();

        return response()->json(['message' => 'Cart cleared']);
    }
}

