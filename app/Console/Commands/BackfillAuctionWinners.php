<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\BidWinner;
use App\Models\BiddingTracking;
use App\Services\AuctionService;
use Illuminate\Support\Facades\Log;

class BackfillAuctionWinners extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'auctions:backfill-winners {--auction-id= : Specific auction ID to backfill}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill missing BidWinner and BiddingTracking records for ended auctions that have winners';

    protected $auctionService;

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
        $this->info('Starting backfill of auction winners...');

        $auctionId = $this->option('auction-id');
        
        if ($auctionId) {
            // Backfill specific auction
            $auctions = Auction::where('id', $auctionId)
                ->where('status', 'ended')
                ->get();
        } else {
            // Backfill all ended auctions (with or without winner_id set)
            $auctions = Auction::where('status', 'ended')
                ->get();
        }

        if ($auctions->isEmpty()) {
            $this->info('No ended auctions with winners found.');
            return 0;
        }

        $this->info("Found {$auctions->count()} auction(s) to process.");

        $created = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($auctions as $auction) {
            try {
                // Determine winner if not set
                $winnerId = $auction->winner_id;
                
                if (!$winnerId) {
                    // Find highest bid to determine winner
                    $highestBid = Bid::where('auction_id', $auction->id)
                        ->orderBy('bid_amount', 'desc')
                        ->first();
                    
                    if (!$highestBid) {
                        $skipped++;
                        $this->line("Skipped auction #{$auction->id}: No bids found");
                        continue;
                    }
                    
                    // Check reserve price
                    if ($auction->reserve_price && $highestBid->bid_amount < $auction->reserve_price) {
                        $skipped++;
                        $this->line("Skipped auction #{$auction->id}: Reserve price not met");
                        continue;
                    }
                    
                    $winnerId = $highestBid->user_id;
                    
                    // Update auction with winner_id if not set
                    if (!$auction->winner_id) {
                        $auction->update(['winner_id' => $winnerId]);
                        $this->line("Updated auction #{$auction->id} with winner_id: {$winnerId}");
                    }
                }
                
                // Check if BidWinner already exists
                $existingBidWinner = BidWinner::where('auction_id', $auction->id)->first();
                
                if ($existingBidWinner) {
                    // Check if BiddingTracking exists
                    $existingTracking = BiddingTracking::where('bid_winner_id', $existingBidWinner->id)->first();
                    
                    if ($existingTracking) {
                        $skipped++;
                        $this->line("Skipped auction #{$auction->id}: Records already exist");
                        continue;
                    } else {
                        // BidWinner exists but BiddingTracking doesn't - create it
                        $winnerUser = $auction->winner ?? \App\Models\User::find($winnerId);
                        BiddingTracking::create([
                            'bid_winner_id' => $existingBidWinner->id,
                            'bid_winner_name' => $winnerUser?->name ?? 'Winner',
                            'bid_won_item_name' => $auction->title ?? 'Auction Item',
                            'payment_status' => 'Pending',
                            'pickup_status' => 'Not Started',
                            'complete_process_date_time' => null,
                            'alert_sent' => false,
                        ]);
                        $created++;
                        $this->info("Created BiddingTracking for auction #{$auction->id}");
                        continue;
                    }
                }

                // No BidWinner exists - create both records
                $this->auctionService->recordWinnerTracking($auction, $winnerId);
                $created++;
                $this->info("Created winner records for auction #{$auction->id}: {$auction->title}");
                
            } catch (\Exception $e) {
                $failed++;
                $this->error("Failed to process auction #{$auction->id}: {$e->getMessage()}");
                Log::error('Failed to backfill winner for auction', [
                    'auction_id' => $auction->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Completed: {$created} created, {$skipped} skipped, {$failed} failed.");

        return 0;
    }
}

