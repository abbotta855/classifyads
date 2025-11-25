<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdPostTransaction extends Model
{
    protected $table = 'ad_post_transactions';

    protected $fillable = [
        'vendor_id',
        'num_of_posted_ad',
        'category_id',
        'amount',
        'payment_method',
        'start_date',
        'end_date',
        'email',
        'status',
    ];

    protected $casts = [
        'num_of_posted_ad' => 'integer',
        'amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}

