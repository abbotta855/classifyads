<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseVerification extends Model
{
  protected $fillable = [
    'buyer_user_id',
    'item',
    'price',
    'purchase_date',
    'verification_code',
    'delivery_status',
  ];

  public function buyerUser(): BelongsTo
  {
    return $this->belongsTo(User::class, 'buyer_user_id');
  }
}
