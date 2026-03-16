<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NepaliProduct extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'company_name',
        'company_history',
        'company_address',
        'company_latitude',
        'company_longitude',
        'category_id',
        'subcategory_id',
        'production_items',
        'materials_use',
        'nutrition_info',
        'usability',
        'quantity',
        'size',
        'shape',
        'color',
        'package_info',
        'manufacture_date',
        'best_before',
        'retail_price',
        'wholesale_price',
        'retail_contact',
        'wholesale_contact',
        'is_made_in_nepal',
        'has_nepali_address',
        'status',
        'views',
        'rating_average',
        'rating_count',
    ];

    protected $casts = [
        'is_made_in_nepal' => 'boolean',
        'has_nepali_address' => 'boolean',
        'company_latitude' => 'decimal:8',
        'company_longitude' => 'decimal:8',
        'retail_price' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'rating_average' => 'decimal:2',
        'views' => 'integer',
        'rating_count' => 'integer',
        'manufacture_date' => 'date',
        'best_before' => 'date',
    ];

    /**
     * Get the user who created the product
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the category
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    /**
     * Get the subcategory
     */
    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'subcategory_id');
    }

    /**
     * Get all images for this product
     */
    public function images(): HasMany
    {
        return $this->hasMany(NepaliProductImage::class)->orderBy('image_order');
    }

    /**
     * Get all ratings for this product
     */
    public function ratings(): HasMany
    {
        return $this->hasMany(NepaliProductRating::class)->orderBy('created_at', 'desc');
    }

    /**
     * Increment view count
     */
    public function incrementViews(): void
    {
        $this->increment('views');
    }

    /**
     * Update rating average and count
     */
    public function updateRatingAverage(): void
    {
        $ratings = $this->ratings;
        $count = $ratings->count();
        
        if ($count > 0) {
            $average = $ratings->avg('rating');
            $this->update([
                'rating_average' => round($average, 2),
                'rating_count' => $count,
            ]);
        } else {
            $this->update([
                'rating_average' => 0,
                'rating_count' => 0,
            ]);
        }
    }

    /**
     * Get the first image (primary/thumbnail)
     */
    public function getPrimaryImageAttribute()
    {
        return $this->images()->orderBy('image_order')->first();
    }
}
