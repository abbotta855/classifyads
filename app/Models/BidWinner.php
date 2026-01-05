<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BidWinner extends Model
{
  public $timestamps = false;

  protected $fillable = [
    'user_id',
    'auction_id',
    'bidding_item',
    'bid_start_date',
    'bid_won_date',
    'payment_proceed_date',
    'total_payment',
    'seller_id',
    'congratulation_email_sent',
  ];

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  public function auction(): BelongsTo
  {
    return $this->belongsTo(Auction::class);
  }

  public function seller(): BelongsTo
  {
    return $this->belongsTo(User::class, 'seller_id');
  }
}
