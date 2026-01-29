<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * List all orders for admin
     */
    public function index(Request $request)
    {
        $status = $request->get('status');
        $userId = $request->get('user_id');
        
        $query = Order::with(['user', 'ad', 'ad.user', 'ad.photos'])
            ->orderByDesc('created_at');
        
        if ($status) {
            $query->where('status', $status);
        }
        
        if ($userId) {
            $query->where('user_id', $userId);
        }
        
        $orders = $query->paginate(50);

        return response()->json($orders);
    }
    
    /**
     * Show a single order
     */
    public function show($id)
    {
        $order = Order::with(['user', 'ad', 'ad.user', 'ad.photos'])
            ->findOrFail($id);
        
        return response()->json($order);
    }
    
    /**
     * Update order status
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,processing,shipped,completed,cancelled,failed',
        ]);
        
        $order = Order::findOrFail($id);
        $order->update($validated);
        
        return response()->json([
            'message' => 'Order status updated successfully',
            'order' => $order->fresh(['user', 'ad']),
        ]);
    }
}

