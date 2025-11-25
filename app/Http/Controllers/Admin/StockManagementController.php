<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StockManagement;
use Illuminate\Http\Request;

class StockManagementController extends Controller
{
    public function index()
    {
        $stocks = StockManagement::with(['vendorSeller', 'category'])
            ->orderBy('quantity', 'asc') // Show low stock first
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($stock) {
                return [
                    'id' => $stock->id,
                    'item_name' => $stock->item_name,
                    'vendor_seller_id' => $stock->vendor_seller_id,
                    'vendor_seller_name' => $stock->vendorSeller->name ?? 'N/A',
                    'category_id' => $stock->category_id,
                    'category_name' => $stock->category->category ?? 'N/A',
                    'subcategory_name' => $stock->category->sub_category ?? null,
                    'quantity' => $stock->quantity,
                    'sold_item_qty' => $stock->sold_item_qty,
                    'low_stock_threshold' => $stock->low_stock_threshold,
                    'is_low_stock' => $stock->isLowStock(),
                    'low_stock_alert_sent' => $stock->low_stock_alert_sent,
                    'created_at' => $stock->created_at,
                    'updated_at' => $stock->updated_at,
                ];
            });

        // Get low stock items for alerts
        $lowStockItems = StockManagement::with(['vendorSeller', 'category'])
            ->whereColumn('quantity', '<=', 'low_stock_threshold')
            ->where('low_stock_alert_sent', false)
            ->get();

        return response()->json([
            'stocks' => $stocks,
            'low_stock_alerts' => $lowStockItems->map(function ($stock) {
                return [
                    'id' => $stock->id,
                    'item_name' => $stock->item_name,
                    'vendor_seller_name' => $stock->vendorSeller->name ?? 'N/A',
                    'quantity' => $stock->quantity,
                    'threshold' => $stock->low_stock_threshold,
                ];
            }),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'vendor_seller_id' => 'required|exists:users,id',
            'category_id' => 'required|exists:categories,id',
            'quantity' => 'required|integer|min:0',
            'sold_item_qty' => 'sometimes|integer|min:0',
            'low_stock_threshold' => 'sometimes|integer|min:0',
        ]);

        $validated['sold_item_qty'] = $validated['sold_item_qty'] ?? 0;
        $validated['low_stock_threshold'] = $validated['low_stock_threshold'] ?? 10;

        $stock = StockManagement::create($validated);

        // Check if low stock and send alert
        if ($stock->isLowStock() && !$stock->low_stock_alert_sent) {
            $stock->update(['low_stock_alert_sent' => true]);
        }

        return response()->json($stock->load(['vendorSeller', 'category']), 201);
    }

    public function show(string $id)
    {
        $stock = StockManagement::with(['vendorSeller', 'category'])->findOrFail($id);
        return response()->json($stock);
    }

    public function update(Request $request, string $id)
    {
        $stock = StockManagement::findOrFail($id);

        $validated = $request->validate([
            'item_name' => 'sometimes|string|max:255',
            'vendor_seller_id' => 'sometimes|exists:users,id',
            'category_id' => 'sometimes|exists:categories,id',
            'quantity' => 'sometimes|integer|min:0',
            'sold_item_qty' => 'sometimes|integer|min:0',
            'low_stock_threshold' => 'sometimes|integer|min:0',
        ]);

        $stock->update($validated);

        // Check if low stock after update
        if ($stock->isLowStock() && !$stock->low_stock_alert_sent) {
            $stock->update(['low_stock_alert_sent' => true]);
        } elseif (!$stock->isLowStock()) {
            // Reset alert if stock is back above threshold
            $stock->update(['low_stock_alert_sent' => false]);
        }

        return response()->json($stock->load(['vendorSeller', 'category']));
    }

    public function destroy(string $id)
    {
        $stock = StockManagement::findOrFail($id);
        $stock->delete();

        return response()->json(['message' => 'Stock item deleted successfully']);
    }

    public function markAlertAsRead(string $id)
    {
        $stock = StockManagement::findOrFail($id);
        $stock->update(['low_stock_alert_sent' => true]);

        return response()->json(['message' => 'Alert marked as read']);
    }
}

