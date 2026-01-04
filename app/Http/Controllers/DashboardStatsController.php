<?php

namespace App\Http\Controllers;

use App\Models\Ad;
use App\Models\Transaction;
use App\Services\WalletService;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardStatsController extends Controller
{
    /**
     * Get dashboard statistics for current user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Listed items count (all ads by user)
        $listedItems = Ad::where('user_id', $user->id)->count();

        // Total sold items (ads with status 'sold')
        $totalSold = Ad::where('user_id', $user->id)
            ->where('status', 'sold')
            ->count();

        // Total bought items (transactions where user is buyer)
        // Assuming transactions with type 'purchase' or 'payment' where user_id is the buyer
        $totalBought = Transaction::where('user_id', $user->id)
            ->whereIn('type', ['purchase', 'payment'])
            ->where('status', 'completed')
            ->count();

        // Total earning (sum of completed transactions where user is seller)
        // Transactions related to ads owned by this user
        $totalEarning = Transaction::whereHas('ad', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('status', 'completed')
            ->whereIn('type', ['purchase', 'payment'])
            ->sum('amount') ?? 0;

        // Format last login
        $lastLogin = $this->formatLastLogin($user->last_login_at);

        // Calculate wallet balance
        $walletService = new WalletService();
        $balance = $walletService->calculateBalance($user->id);

        return response()->json([
            'listed_items' => $listedItems,
            'total_sold' => $totalSold,
            'total_bought' => $totalBought,
            'total_earning' => (float) $totalEarning,
            'balance' => $balance,
            'last_login' => $lastLogin,
            'last_login_at' => $user->last_login_at ? $user->last_login_at->toIso8601String() : null,
        ]);
    }

    /**
     * Format last login time in human-readable format
     */
    private function formatLastLogin($lastLoginAt)
    {
        if (!$lastLoginAt) {
            return 'Never';
        }

        $now = Carbon::now();
        $lastLogin = Carbon::parse($lastLoginAt);
        
        // Use diffForHumans for better formatting, but handle edge cases
        if ($lastLogin->isFuture()) {
            // If last login is in the future (timezone issue), just show the date
            return $lastLogin->format('M d, Y');
        }
        
        // Use diffForHumans which handles all the formatting automatically
        return $lastLogin->diffForHumans();
    }
}
