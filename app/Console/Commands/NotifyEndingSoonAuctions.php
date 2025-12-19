<?php

namespace App\Console\Commands;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\UserNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class NotifyEndingSoonAuctions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auctions:notify-ending-soon';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Notify bidders about auctions ending soon (within 1 hour)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for auctions ending soon...');

        // Find auctions ending within 1 hour
        $endingSoon = Auction::where('status', 'active')
            ->where('end_time', '>', now())
            ->where('end_time', '<=', now()->addHour())
            ->get();

        if ($endingSoon->isEmpty()) {
            $this->info('No auctions ending soon.');
            return 0;
        }

        $this->info("Found {$endingSoon->count()} auction(s) ending soon.");

        $notified = 0;
        $failed = 0;

        foreach ($endingSoon as $auction) {
            try {
                // Get all users who have bid on this auction
                $bidders = Bid::where('auction_id', $auction->id)
                    ->distinct()
                    ->pluck('user_id');

                // Also notify the seller
                $sellerId = $auction->user_id;
                $allUsers = $bidders->push($sellerId)->unique();

                foreach ($allUsers as $userId) {
                    // Check if we've already notified this user about this auction ending soon
                    $alreadyNotified = UserNotification::where('user_id', $userId)
                        ->where('type', 'auction_ending_soon')
                        ->where('metadata->auction_id', $auction->id)
                        ->exists();

                    if (!$alreadyNotified) {
                        $timeRemaining = now()->diffInMinutes($auction->end_time);
                        $timeText = $timeRemaining < 60 
                            ? "{$timeRemaining} minute" . ($timeRemaining !== 1 ? 's' : '')
                            : round($timeRemaining / 60, 1) . " hour" . (round($timeRemaining / 60, 1) !== 1 ? 's' : '');

                        UserNotification::create([
                            'user_id' => $userId,
                            'type' => 'auction_ending_soon',
                            'title' => 'Auction Ending Soon',
                            'message' => "The auction '{$auction->title}' is ending in {$timeText}. Current bid: Rs. " . number_format($auction->current_bid_price ?? $auction->starting_price, 2),
                            'metadata' => ['auction_id' => $auction->id],
                            'is_read' => false,
                        ]);
                    }
                }

                $notified++;
                $this->info("Notified users about auction #{$auction->id}: {$auction->title}");
            } catch (\Exception $e) {
                $failed++;
                $this->error("Error notifying about auction #{$auction->id}: {$e->getMessage()}");
                Log::error('Error notifying about ending soon auction', [
                    'auction_id' => $auction->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Completed: {$notified} notified, {$failed} failed.");

        return 0;
    }
}
