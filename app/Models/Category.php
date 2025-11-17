<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Category extends Model
{
  protected $fillable = [
    'name',
    'slug',
    'parent_id',
    'description',
    'icon',
    'sort_order',
    'is_active',
    'total_ads',
  ];

  protected $casts = [
    'is_active' => 'boolean',
    'sort_order' => 'integer',
    'total_ads' => 'integer',
  ];

  /**
   * Get the parent category.
   */
  public function parent(): BelongsTo
  {
    return $this->belongsTo(Category::class, 'parent_id');
  }

  /**
   * Get the subcategories for the category.
   */
  public function children(): HasMany
  {
    return $this->hasMany(Category::class, 'parent_id')->where('is_active', true)->orderBy('name');
  }

  /**
   * Get subcategories (alias for children for backward compatibility).
   */
  public function subcategories(): HasMany
  {
    return $this->children();
  }

  /**
   * Get the total number of ads in this category (including subcategories).
   */
  public function getTotalAdsCountAttribute(): int
  {
    // This will be implemented when we create the listings table
    // For now, return the cached total_ads
    return $this->total_ads ?? 0;
  }
}
