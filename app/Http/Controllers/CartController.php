<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CartController extends Controller
{
    /**
     * Get user's cart
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['items' => []]);
        }

        $cartKey = "cart_user_{$user->id}";
        $cart = Cache::get($cartKey, []);

        // Enrich cart items with ad data
        $enrichedCart = [];
        foreach ($cart as $item) {
            $ad = Ad::with('photos')->find($item['ad_id']);
            if ($ad && $ad->status === 'approved') {
                $enrichedCart[] = [
                    'ad_id' => $ad->id,
                    'title' => $ad->title,
                    'price' => (float) $ad->price,
                    'quantity' => (int) ($item['quantity'] ?? 1),
                    'total' => (float) $ad->price * (int) ($item['quantity'] ?? 1),
                    'image' => $ad->photos->first()?->photo_url,
                    'slug' => $ad->slug,
                ];
            }
        }

        return response()->json(['items' => $enrichedCart]);
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

        $cartKey = "cart_user_{$user->id}";
        $cart = Cache::get($cartKey, []);

        // Check if item already exists
        $existingIndex = null;
        foreach ($cart as $index => $item) {
            if ($item['ad_id'] == $validated['ad_id']) {
                $existingIndex = $index;
                break;
            }
        }

        $quantity = $validated['quantity'] ?? 1;

        if ($existingIndex !== null) {
            // Update quantity
            $cart[$existingIndex]['quantity'] += $quantity;
        } else {
            // Add new item
            $cart[] = [
                'ad_id' => $validated['ad_id'],
                'quantity' => $quantity,
            ];
        }

        Cache::put($cartKey, $cart, now()->addDays(30));

        return response()->json([
            'message' => 'Item added to cart',
            'cart' => $cart,
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

        $cartKey = "cart_user_{$user->id}";
        $cart = Cache::get($cartKey, []);

        foreach ($cart as $index => $item) {
            if ($item['ad_id'] == $adId) {
                $cart[$index]['quantity'] = $validated['quantity'];
                Cache::put($cartKey, $cart, now()->addDays(30));
                return response()->json(['message' => 'Cart updated', 'cart' => $cart]);
            }
        }

        return response()->json(['error' => 'Item not found in cart'], 404);
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

        $cartKey = "cart_user_{$user->id}";
        $cart = Cache::get($cartKey, []);

        $cart = array_filter($cart, function ($item) use ($adId) {
            return $item['ad_id'] != $adId;
        });

        Cache::put($cartKey, array_values($cart), now()->addDays(30));

        return response()->json(['message' => 'Item removed from cart', 'cart' => array_values($cart)]);
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

        $cartKey = "cart_user_{$user->id}";
        Cache::forget($cartKey);

        return response()->json(['message' => 'Cart cleared']);
    }
}

