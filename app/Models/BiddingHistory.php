<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BiddingHistory extends Model
{
  protected $table = 'bidding_history';

  public $timestamps = false;

  protected $fillable = [
    'user_id',
    'auction_id',
    'item_name',
    'reserve_price',
    'buy_now_price',
    'payment_method',
    'start_date_time',
  ];

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  public function auction(): BelongsTo
  {
    return $this->belongsTo(Auction::class);
  }
}
