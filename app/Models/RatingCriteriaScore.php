<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RatingCriteriaScore extends Model
{
    protected $fillable = [
        'rating_id',
        'rating_criteria_id',
        'score',
    ];

    protected $casts = [
        'score' => 'integer',
    ];

    public function rating(): BelongsTo
    {
        return $this->belongsTo(Rating::class);
    }

    public function criteria(): BelongsTo
    {
        return $this->belongsTo(RatingCriteria::class, 'rating_criteria_id');
    }
}
