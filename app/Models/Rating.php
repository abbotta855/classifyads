<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rating extends Model
{
    protected $fillable = [
        'user_id',
        'ad_id',
        'seller_id',
        'rating',
        'comment',
        'purchase_verified',
        'purchase_code',
    ];

    protected $casts = [
        'rating' => 'integer',
        'purchase_verified' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function ad(): BelongsTo
    {
        return $this->belongsTo(Ad::class);
    }

    public function criteriaScores(): HasMany
    {
        return $this->hasMany(RatingCriteriaScore::class);
    }
}

