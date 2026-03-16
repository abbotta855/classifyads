<?php

namespace App\Console\Commands;

use App\Models\Auction;
use App\Services\AuctionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckEndedAuctions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auctions:check-ended';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and end auctions that have passed their end time';

    protected AuctionService $auctionService;

    public function __construct(AuctionService $auctionService)
    {
        parent::__construct();
        $this->auctionService = $auctionService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for ended auctions...');

        // Find auctions that should be ended
        // Check both 'active' and 'pending' auctions that have passed their end_time
        $auctionsToEnd = Auction::whereIn('status', ['active', 'pending'])
            ->where('end_time', '<=', now())
            ->get();

        if ($auctionsToEnd->isEmpty()) {
            $this->info('No auctions to end.');
            return 0;
        }

        $this->info("Found {$auctionsToEnd->count()} auction(s) to end.");

        $ended = 0;
        $failed = 0;

        foreach ($auctionsToEnd as $auction) {
            try {
                $result = $this->auctionService->endAuction($auction->id);
                
                if ($result['success']) {
                    $ended++;
                    $this->info("Ended auction #{$auction->id}: {$auction->title}");
                } else {
                    $failed++;
                    $this->error("Failed to end auction #{$auction->id}: {$result['message']}");
                    Log::warning('Failed to end auction', [
                        'auction_id' => $auction->id,
                        'message' => $result['message'],
                    ]);
                }
            } catch (\Exception $e) {
                $failed++;
                $this->error("Error ending auction #{$auction->id}: {$e->getMessage()}");
                Log::error('Error ending auction', [
                    'auction_id' => $auction->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Completed: {$ended} ended, {$failed} failed.");

        return 0;
    }
}
