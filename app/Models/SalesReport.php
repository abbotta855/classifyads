<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesReport extends Model
{
    protected $table = 'sales_report';

    protected $fillable = [
        'user_id',
        'listed_items',
        'sold_items',
        'earning',
        'total_earning',
    ];

    protected $casts = [
        'listed_items' => 'integer',
        'sold_items' => 'integer',
        'earning' => 'decimal:2',
        'total_earning' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

