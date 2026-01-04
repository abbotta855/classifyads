<?php

namespace App\Services;

use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class WalletService
{
    /**
     * Calculate wallet balance for a user
     * Balance = Sum of completed deposits - Sum of completed withdrawals
     * 
     * @param int $userId
     * @return float
     */
    public function calculateBalance(int $userId): float
    {
        $balance = Transaction::where('user_id', $userId)
            ->where('status', 'completed')
            ->whereIn('type', ['deposit', 'withdraw'])
            ->selectRaw('
                SUM(
                    CASE 
                        WHEN type = ? THEN amount
                        WHEN type = ? THEN -amount
                        ELSE 0
                    END
                ) as balance
            ', ['deposit', 'withdraw'])
            ->value('balance');

        return (float) ($balance ?? 0);
    }

    /**
     * Check if user has enough balance for withdrawal
     * 
     * @param int $userId
     * @param float $amount
     * @return bool
     */
    public function canWithdraw(int $userId, float $amount): bool
    {
        $balance = $this->calculateBalance($userId);
        return $balance >= $amount;
    }

    /**
     * Get pending withdrawal requests for a user
     * 
     * @param int $userId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getPendingWithdrawals(int $userId)
    {
        return Transaction::where('user_id', $userId)
            ->where('type', 'withdraw')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get available balance (excluding pending withdrawals)
     * 
     * @param int $userId
     * @return float
     */
    public function getAvailableBalance(int $userId): float
    {
        $balance = $this->calculateBalance($userId);
        
        // Subtract pending withdrawals
        $pendingWithdrawals = Transaction::where('user_id', $userId)
            ->where('type', 'withdraw')
            ->where('status', 'pending')
            ->sum('amount');

        return max(0, $balance - (float) $pendingWithdrawals);
    }

    /**
     * Get total withdrawals for today
     * 
     * @param int $userId
     * @return float
     */
    public function getTodayWithdrawals(int $userId): float
    {
        return Transaction::where('user_id', $userId)
            ->where('type', 'withdraw')
            ->where('status', 'pending')
            ->whereDate('created_at', today())
            ->sum('amount');
    }

    /**
     * Get count of withdrawals for today
     * 
     * @param int $userId
     * @return int
     */
    public function getTodayWithdrawalCount(int $userId): int
    {
        return Transaction::where('user_id', $userId)
            ->where('type', 'withdraw')
            ->where('status', 'pending')
            ->whereDate('created_at', today())
            ->count();
    }
}

