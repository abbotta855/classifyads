<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Offer extends Model
{
    protected $fillable = [
        'item_name',
        'ad_id',
        'vendor_id',
        'offer_percentage',
        'created_date',
        'valid_until',
        'status',
    ];

    protected $casts = [
        'offer_percentage' => 'decimal:2',
        'created_date' => 'date',
        'valid_until' => 'date',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function ad(): BelongsTo
    {
        return $this->belongsTo(Ad::class);
    }
}

