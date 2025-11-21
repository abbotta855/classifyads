<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Delivery extends Model
{
  protected $fillable = [
    'seller_vendor_id',
    'item',
    'price',
    'delivery_status',
    'pickup_date',
  ];

  public function sellerVendor(): BelongsTo
  {
    return $this->belongsTo(User::class, 'seller_vendor_id');
  }
}
