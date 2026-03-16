<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailSubscriber extends Model
{
    protected $fillable = [
        'user_id',
        'username',
        'email',
        'subscribe_volume',
        'amount',
        'start_date',
        'end_date',
        'subscription_type',
    ];

    protected $casts = [
        'subscribe_volume' => 'integer',
        'amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

