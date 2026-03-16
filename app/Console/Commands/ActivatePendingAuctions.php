<?php

namespace App\Console\Commands;

use App\Models\Auction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ActivatePendingAuctions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auctions:activate-pending';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Activate pending auctions when their start time arrives';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for pending auctions to activate...');

        // Find pending auctions that should be activated (start_time has passed)
        $auctionsToActivate = Auction::where('status', 'pending')
            ->where('start_time', '<=', now())
            ->where('end_time', '>', now())
            ->get();

        if ($auctionsToActivate->isEmpty()) {
            $this->info('No pending auctions to activate.');
            return 0;
        }

        $this->info("Found {$auctionsToActivate->count()} auction(s) to activate.");

        $activated = 0;
        $failed = 0;

        foreach ($auctionsToActivate as $auction) {
            try {
                $auction->update(['status' => 'active']);
                $activated++;
                $this->info("Activated auction #{$auction->id}: {$auction->title}");
            } catch (\Exception $e) {
                $failed++;
                $this->error("Error activating auction #{$auction->id}: {$e->getMessage()}");
                Log::error('Error activating auction', [
                    'auction_id' => $auction->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Completed: {$activated} activated, {$failed} failed.");

        return 0;
    }
}
