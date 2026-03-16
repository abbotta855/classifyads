<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NepaliProductImage extends Model
{
    protected $fillable = [
        'nepali_product_id',
        'image_path',
        'image_order',
    ];

    protected $casts = [
        'image_order' => 'integer',
    ];

    /**
     * Get the product this image belongs to
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(NepaliProduct::class, 'nepali_product_id');
    }

    /**
     * Get the full URL for the image
     */
    public function getImageUrlAttribute(): string
    {
        if (str_starts_with($this->image_path, 'http')) {
            return $this->image_path;
        }
        return asset('storage/' . $this->image_path);
    }
}
