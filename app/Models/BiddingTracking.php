<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BiddingTracking extends Model
{
  protected $fillable = [
    'bid_winner_id',
    'bid_winner_name',
    'bid_won_item_name',
    'payment_status',
    'pickup_status',
    'complete_process_date_time',
    'alert_sent',
  ];

  public function bidWinner(): BelongsTo
  {
    return $this->belongsTo(BidWinner::class);
  }
}
