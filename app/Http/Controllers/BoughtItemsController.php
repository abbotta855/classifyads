<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Ad;
use App\Models\User;
use Illuminate\Http\Request;

class BoughtItemsController extends Controller
{
    /**
     * Get all items bought by the current user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get all completed purchase/payment transactions for this user
        $transactions = Transaction::with(['ad.category', 'ad.user'])
            ->where('user_id', $user->id)
            ->whereIn('type', ['purchase', 'payment'])
            ->where('status', 'completed')
            ->whereNotNull('related_ad_id')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($transaction) {
                $ad = $transaction->ad;
                $seller = $ad ? $ad->user : null;

                return [
                    'id' => $transaction->id,
                    'transaction_id' => $transaction->id,
                    'ad_id' => $transaction->related_ad_id,
                    'item_name' => $ad ? $ad->title : ($transaction->description ?? 'Unknown Item'),
                    'category' => $ad && $ad->category ? $ad->category->category : 'Uncategorized',
                    'subcategory' => $ad && $ad->category ? $ad->category->sub_category : null,
                    'price' => (float) $transaction->amount,
                    'seller_id' => $seller ? $seller->id : null,
                    'seller_name' => $seller ? $seller->name : 'Unknown Seller',
                    'seller_info' => $seller ? [
                        'name' => $seller->name,
                        'email' => $seller->email,
                        'address' => $seller->locationRelation ? $seller->locationRelation->name : null,
                        'selected_local_address' => $seller->selected_local_address,
                    ] : null,
                    'purchase_date' => $transaction->created_at->toIso8601String(),
                    'payment_method' => $transaction->payment_method,
                    'ad_image' => $ad ? ($ad->image1_url ?? null) : null,
                ];
            });

        // Calculate totals
        $totalBought = $transactions->count();
        $totalSpent = $transactions->sum('price');

        return response()->json([
            'items' => $transactions,
            'total_bought' => $totalBought,
            'total_spent' => $totalSpent,
        ]);
    }
}

