<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Ad;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

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

        // Enforce wallet balance (even in demo) to prevent negative balances
        $availableBalance = $this->walletService->getAvailableBalance($user->id);
        if ($availableBalance < $total) {
            return response()->json([
                'error' => 'Insufficient wallet balance. Please add funds to continue.',
                'needs_top_up' => true,
                'required' => $total,
                'available' => $availableBalance,
            ], 402);
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
     * List user's orders
     */
    public function index(Request $request)
    {
        $status = $request->get('status');
        
        $query = Order::with(['ad', 'ad.user', 'ad.photos'])
            ->where('user_id', $request->user()->id);
        
        if ($status) {
            $query->where('status', $status);
        }
        
        $orders = $query->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($orders);
    }

    /**
     * Show a single order
     */
    public function show(Request $request, $id)
    {
        $order = Order::with(['ad', 'ad.user', 'ad.photos', 'user'])
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($order);
    }

    /**
     * Update order status (user can cancel pending orders)
     */
    public function update(Request $request, $id)
    {
        $order = Order::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:cancelled',
        ]);

        if ($order->status !== 'pending') {
            return response()->json([
                'error' => 'Only pending orders can be cancelled'
            ], 400);
        }

        $order->update(['status' => 'cancelled']);

        return response()->json([
            'message' => 'Order cancelled successfully',
            'order' => $order->fresh(),
        ]);
    }
}


