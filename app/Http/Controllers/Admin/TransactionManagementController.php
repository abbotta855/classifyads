<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdPostTransaction;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TransactionManagementController extends Controller
{
    public function index()
    {
        // Get all ad post transactions
        $transactions = AdPostTransaction::with(['vendor', 'category'])
            ->orderBy('start_date', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'vendor_id' => $transaction->vendor_id,
                    'vendor_name' => $transaction->vendor->name ?? 'N/A',
                    'num_of_posted_ad' => $transaction->num_of_posted_ad,
                    'category_id' => $transaction->category_id,
                    'category_name' => $transaction->category->category ?? 'N/A',
                    'subcategory_name' => $transaction->category->sub_category ?? null,
                    'amount' => $transaction->amount,
                    'payment_method' => $transaction->payment_method,
                    'start_date' => $transaction->start_date,
                    'end_date' => $transaction->end_date,
                    'email' => $transaction->email ?? $transaction->vendor->email ?? 'N/A',
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at,
                    'updated_at' => $transaction->updated_at,
                ];
            });

        // Calculate earning summaries
        // Total earning from Ad post (all time)
        $totalEarning = AdPostTransaction::sum('amount') ?? 0;

        // Total earning from Ad post Weekly
        $weeklyEarning = AdPostTransaction::whereBetween('start_date', [
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek()
        ])->sum('amount') ?? 0;

        // Total earning from Ad post Monthly
        $monthlyEarning = AdPostTransaction::whereMonth('start_date', Carbon::now()->month)
            ->whereYear('start_date', Carbon::now()->year)
            ->sum('amount') ?? 0;

        // Total earning from Ad post Yearly
        $yearlyEarning = AdPostTransaction::whereYear('start_date', Carbon::now()->year)
            ->sum('amount') ?? 0;

        // Total earning from Ad post major category wise
        $categoryWiseEarning = AdPostTransaction::join('categories', 'ad_post_transactions.category_id', '=', 'categories.id')
            ->select('categories.category', DB::raw('SUM(ad_post_transactions.amount) as total'))
            ->groupBy('categories.category')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'total' => $item->total,
                ];
            });

        return response()->json([
            'transactions' => $transactions,
            'earning_summary' => [
                'total' => round($totalEarning, 2),
                'weekly' => round($weeklyEarning, 2),
                'monthly' => round($monthlyEarning, 2),
                'yearly' => round($yearlyEarning, 2),
                'category_wise' => $categoryWiseEarning,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vendor_id' => 'required|exists:users,id',
            'num_of_posted_ad' => 'required|integer|min:0',
            'category_id' => 'nullable|exists:categories,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'email' => 'nullable|email|max:255',
            'status' => 'sometimes|in:active,expired,cancelled',
        ]);

        $validated['status'] = $validated['status'] ?? 'active';

        $transaction = AdPostTransaction::create($validated);

        return response()->json($transaction->load(['vendor', 'category']), 201);
    }

    public function show(string $id)
    {
        $transaction = AdPostTransaction::with(['vendor', 'category'])->findOrFail($id);
        return response()->json($transaction);
    }

    public function update(Request $request, string $id)
    {
        $transaction = AdPostTransaction::findOrFail($id);

        $validated = $request->validate([
            'vendor_id' => 'sometimes|exists:users,id',
            'num_of_posted_ad' => 'sometimes|integer|min:0',
            'category_id' => 'sometimes|nullable|exists:categories,id',
            'amount' => 'sometimes|numeric|min:0',
            'payment_method' => 'sometimes|string|max:255',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'email' => 'sometimes|nullable|email|max:255',
            'status' => 'sometimes|in:active,expired,cancelled',
        ]);

        $transaction->update($validated);

        return response()->json($transaction->load(['vendor', 'category']));
    }

    public function destroy(string $id)
    {
        $transaction = AdPostTransaction::findOrFail($id);
        $transaction->delete();

        return response()->json(['message' => 'Transaction deleted successfully']);
    }
}

