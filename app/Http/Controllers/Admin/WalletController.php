<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WalletController extends Controller
{
    protected WalletService $walletService;

    public function __construct(WalletService $walletService)
    {
        $this->walletService = $walletService;
    }

    /**
     * Get all pending withdrawal requests
     */
    public function getPendingWithdrawals(Request $request)
    {
        $withdrawals = Transaction::where('type', 'withdraw')
            ->where('status', 'pending')
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($transaction) {
                // Use paypal_email column if available, otherwise extract from description (backward compatibility)
                $paypalEmail = $transaction->paypal_email;
                if (!$paypalEmail && preg_match('/PayPal:\s*([^\s|]+)/', $transaction->description, $matches)) {
                    $paypalEmail = $matches[1];
                }
                
                return [
                    'id' => $transaction->id,
                    'user_id' => $transaction->user_id,
                    'user_name' => $transaction->user->name ?? 'Unknown',
                    'user_email' => $transaction->user->email ?? 'Unknown',
                    'paypal_email' => $paypalEmail,
                    'amount' => $transaction->amount,
                    'description' => $transaction->description,
                    'created_at' => $transaction->created_at,
                    'updated_at' => $transaction->updated_at,
                ];
            });

        return response()->json($withdrawals);
    }

    /**
     * Approve withdrawal request
     */
    public function approveWithdrawal(Request $request, $id)
    {
        $request->validate([
            'payment_id' => 'required|string|max:255', // PayPal transaction ID or payment reference
            'notes' => 'nullable|string|max:500',
        ]);

        $transaction = Transaction::where('type', 'withdraw')
            ->where('status', 'pending')
            ->findOrFail($id);

        $paymentId = $request->input('payment_id');
        $notes = $request->input('notes');

        // Update transaction status to completed with payment ID
        $description = $transaction->description;
        if ($notes) {
            $description .= ' | Notes: ' . $notes;
        }

        $transaction->update([
            'status' => 'completed',
            'payment_id' => $paymentId,
            'description' => $description,
        ]);

        Log::info('Withdrawal approved', [
            'transaction_id' => $transaction->id,
            'user_id' => $transaction->user_id,
            'amount' => $transaction->amount,
            'payment_id' => $paymentId,
            'admin_id' => $request->user()->id,
            'notes' => $notes,
        ]);

        return response()->json([
            'message' => 'Withdrawal approved successfully. Payment processed.',
            'transaction' => $transaction->fresh(),
        ]);
    }

    /**
     * Reject withdrawal request
     */
    public function rejectWithdrawal(Request $request, $id)
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $transaction = Transaction::where('type', 'withdraw')
            ->where('status', 'pending')
            ->findOrFail($id);

        // Update transaction status to cancelled
        $transaction->update([
            'status' => 'cancelled',
            'description' => $transaction->description . ' (Rejected: ' . ($request->input('reason') ?? 'No reason provided') . ')',
        ]);

        Log::info('Withdrawal rejected', [
            'transaction_id' => $transaction->id,
            'user_id' => $transaction->user_id,
            'amount' => $transaction->amount,
            'admin_id' => $request->user()->id,
            'reason' => $request->input('reason'),
        ]);

        return response()->json([
            'message' => 'Withdrawal rejected successfully',
            'transaction' => $transaction,
        ]);
    }

    /**
     * Get all withdrawals (for admin view)
     */
    public function getAllWithdrawals(Request $request)
    {
        $status = $request->input('status', 'all'); // all, pending, completed, cancelled
        
        $query = Transaction::where('type', 'withdraw')
            ->with('user')
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $withdrawals = $query->get()->map(function ($transaction) {
            // Use paypal_email column if available, otherwise extract from description (backward compatibility)
            $paypalEmail = $transaction->paypal_email;
            if (!$paypalEmail && preg_match('/PayPal:\s*([^\s|]+)/', $transaction->description, $matches)) {
                $paypalEmail = $matches[1];
            }
            
            return [
                'id' => $transaction->id,
                'user_id' => $transaction->user_id,
                'user_name' => $transaction->user->name ?? 'Unknown',
                'user_email' => $transaction->user->email ?? 'Unknown',
                'paypal_email' => $paypalEmail,
                'amount' => $transaction->amount,
                'status' => $transaction->status,
                'payment_id' => $transaction->payment_id,
                'description' => $transaction->description,
                'created_at' => $transaction->created_at,
                'updated_at' => $transaction->updated_at,
            ];
        });

        return response()->json($withdrawals);
    }

    /**
     * Get all wallet transactions (deposits, withdrawals, seller verification, etc.)
     */
    public function getAllWalletTransactions(Request $request)
    {
        $type = $request->input('type', 'all'); // all, deposit, withdraw, seller_verification, etc.
        $status = $request->input('status', 'all'); // all, pending, completed, failed, cancelled
        
        $query = Transaction::with('user')
            ->orderBy('created_at', 'desc');

        // Filter by type
        if ($type !== 'all') {
            $query->where('type', $type);
        } else {
            // Show wallet-related transactions
            $query->whereIn('type', ['deposit', 'withdraw', 'seller_verification', 'ebook_purchase', 'auction_deposit']);
        }

        // Filter by status
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        $transactions = $query->get()->map(function ($transaction) {
            // Use paypal_email column if available, otherwise extract from description (backward compatibility)
            $paypalEmail = $transaction->paypal_email;
            if (!$paypalEmail && ($transaction->type === 'deposit' || $transaction->type === 'withdraw')) {
                if (preg_match('/PayPal:\s*([^\s|]+)/', $transaction->description, $matches)) {
                    $paypalEmail = $matches[1];
                }
            }
            
            return [
                'id' => $transaction->id,
                'user_id' => $transaction->user_id,
                'user_name' => $transaction->user->name ?? 'Unknown',
                'user_email' => $transaction->user->email ?? 'Unknown',
                'type' => $transaction->type,
                'amount' => $transaction->amount,
                'status' => $transaction->status,
                'payment_method' => $transaction->payment_method,
                'payment_id' => $transaction->payment_id,
                'paypal_email' => $paypalEmail,
                'description' => $transaction->description,
                'created_at' => $transaction->created_at,
                'updated_at' => $transaction->updated_at,
            ];
        });

        return response()->json($transactions);
    }
}

