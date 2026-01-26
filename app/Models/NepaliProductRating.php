<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NepaliProductRating extends Model
{
    protected $fillable = [
        'nepali_product_id',
        'user_id',
        'rating',
        'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    /**
     * Get the product this rating belongs to
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(NepaliProduct::class, 'nepali_product_id');
    }

    /**
     * Get the user who made this rating
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
