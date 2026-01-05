<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Ad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Demo checkout: create order, simulate wallet payment (debit buyer, credit seller), mark completed.
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.ad_id' => 'required|exists:ads,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $user = $request->user();

        // Calculate totals and prepare lines
        $lines = [];
        $total = 0;
        foreach ($validated['items'] as $line) {
            $ad = Ad::findOrFail($line['ad_id']);
            $qty = (int) $line['quantity'];
            $price = (float) ($ad->price ?? 0);
            $lineTotal = $price * $qty;
            $lines[] = [
                'ad' => $ad,
                'quantity' => $qty,
                'price' => $price,
                'line_total' => $lineTotal,
            ];
            $total += $lineTotal;
        }

        DB::beginTransaction();
        try {
            // For simplicity, only one ad per order in this demo (take the first)
            $first = $lines[0];
            $order = Order::create([
                'user_id' => $user->id,
                'ad_id' => $first['ad']->id,
                'title' => $first['ad']->title,
                'price' => $first['price'],
                'quantity' => $first['quantity'],
                'total' => $total,
                'payment_method' => 'wallet-demo',
                'status' => 'pending',
            ]);

            // Simulate wallet payment: debit buyer (withdraw), credit seller (deposit)
            $paymentId = 'DEMO-ORDER-' . time() . '-' . $user->id;
            Transaction::create([
                'user_id' => $user->id,
                'type' => 'withdraw',
                'amount' => $total,
                'status' => 'completed',
                'payment_method' => 'wallet-demo',
                'payment_id' => $paymentId,
                'description' => "Order {$order->id} payment (demo)",
                'related_ad_id' => $first['ad']->id,
            ]);

            // Credit seller (demo)
            Transaction::create([
                'user_id' => $first['ad']->user_id,
                'type' => 'deposit',
                'amount' => $total,
                'status' => 'completed',
                'payment_method' => 'wallet-demo',
                'payment_id' => $paymentId,
                'description' => "Order {$order->id} payout (demo)",
                'related_ad_id' => $first['ad']->id,
            ]);

            $order->update([
                'status' => 'completed',
                'payment_id' => $paymentId,
            ]);

            DB::commit();

            return response()->json([
                'order' => $order->fresh(),
                'message' => 'Checkout completed (demo). Payment simulated.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Checkout failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * List user's orders (demo)
     */
    public function index(Request $request)
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($orders);
    }
}


