<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Auction extends Model
{
  protected $fillable = [
    'user_id',
    'category_id',
    'title',
    'description',
    'starting_price',
    'reserve_price',
    'buy_now_price',
    'current_bid_price',
    'current_bidder_id',
    'start_date_time',
    'end_date_time',
  ];

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  public function category(): BelongsTo
  {
    return $this->belongsTo(Category::class);
  }

  public function currentBidder(): BelongsTo
  {
    return $this->belongsTo(User::class, 'current_bidder_id');
  }
}
