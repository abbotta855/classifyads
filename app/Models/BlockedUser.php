<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BlockedUser extends Model
{
  protected $fillable = [
    'user_id',
    'email',
    'address',
    'date_to_block',
    'reason_to_block',
  ];

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }
}
