<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bid extends Model
{
    protected $fillable = [
        'auction_id',
        'user_id',
        'bid_amount',
        'max_bid_amount',
        'is_proxy_bid',
        'is_winning_bid',
        'outbid_at',
    ];

    protected $casts = [
        'bid_amount' => 'decimal:2',
        'max_bid_amount' => 'decimal:2',
        'is_proxy_bid' => 'boolean',
        'is_winning_bid' => 'boolean',
        'outbid_at' => 'datetime',
    ];

    public function auction(): BelongsTo
    {
        return $this->belongsTo(Auction::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if this bid is currently winning
     */
    public function isWinning(): bool
    {
        return $this->is_winning_bid;
    }

    /**
     * Mark this bid as outbid
     */
    public function markAsOutbid(): void
    {
        $this->update([
            'is_winning_bid' => false,
            'outbid_at' => now(),
        ]);
    }
}
