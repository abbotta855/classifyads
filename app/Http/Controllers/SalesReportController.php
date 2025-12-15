<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Ebook;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SalesReportController extends Controller
{
    /**
     * Get sales report for authenticated user
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Get eBook sales (transactions where user is the seller)
        $ebookSales = Transaction::with(['ebook', 'user'])
            ->whereHas('ebook', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('type', 'ebook_purchase')
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc');

        // Get regular ad sales (transactions where user is the seller)
        $adSales = Transaction::with(['ad', 'user'])
            ->whereHas('ad', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('type', 'payment')
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc');

        // Apply date filters if provided
        if ($request->has('start_date')) {
            $startDate = $request->start_date;
            $ebookSales->whereDate('created_at', '>=', $startDate);
            $adSales->whereDate('created_at', '>=', $startDate);
        }

        if ($request->has('end_date')) {
            $endDate = $request->end_date;
            $ebookSales->whereDate('created_at', '<=', $endDate);
            $adSales->whereDate('created_at', '<=', $endDate);
        }

        $ebookSalesData = $ebookSales->get()->map(function($transaction) {
            return [
                'id' => $transaction->id,
                'type' => 'ebook',
                'item_name' => $transaction->ebook->title ?? 'N/A',
                'buyer_name' => $transaction->user->name ?? 'N/A',
                'amount' => $transaction->amount,
                'payment_method' => $transaction->payment_method,
                'verification_code' => $transaction->verification_code,
                'sold_at' => $transaction->created_at,
            ];
        });

        $adSalesData = $adSales->get()->map(function($transaction) {
            return [
                'id' => $transaction->id,
                'type' => 'ad',
                'item_name' => $transaction->ad->title ?? 'N/A',
                'buyer_name' => $transaction->user->name ?? 'N/A',
                'amount' => $transaction->amount,
                'payment_method' => $transaction->payment_method,
                'verification_code' => null,
                'sold_at' => $transaction->created_at,
            ];
        });

        // Combine and sort by date
        $allSales = $ebookSalesData->concat($adSalesData)
            ->sortByDesc('sold_at')
            ->values();

        // Calculate totals
        $totalRevenue = $allSales->sum('amount');
        $ebookRevenue = $ebookSalesData->sum('amount');
        $adRevenue = $adSalesData->sum('amount');
        $totalSales = $allSales->count();

        return response()->json([
            'sales' => $allSales,
            'summary' => [
                'total_revenue' => $totalRevenue,
                'ebook_revenue' => $ebookRevenue,
                'ad_revenue' => $adRevenue,
                'total_sales' => $totalSales,
                'ebook_sales_count' => $ebookSalesData->count(),
                'ad_sales_count' => $adSalesData->count(),
            ],
        ]);
    }
}
