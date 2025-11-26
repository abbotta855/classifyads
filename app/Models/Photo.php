<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Photo extends Model
{
    use HasFactory;

    protected $fillable = [
        'ad_id',
        'photo_url',
        'photo_order',
        'is_primary',
    ];

    protected $casts = [
        'photo_order' => 'integer',
        'is_primary' => 'boolean',
    ];

    /**
     * Get the ad that owns the photo
     */
    public function ad(): BelongsTo
    {
        return $this->belongsTo(Ad::class);
    }
}
