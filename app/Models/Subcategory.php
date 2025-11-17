<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subcategory extends Model
{
  protected $fillable = [
    'category_id',
    'name',
    'slug',
    'description',
    'sort_order',
    'is_active',
  ];

  protected $casts = [
    'is_active' => 'boolean',
    'sort_order' => 'integer',
  ];

  /**
   * Get the category that owns the subcategory.
   */
  public function category(): BelongsTo
  {
    return $this->belongsTo(Category::class);
  }

  /**
   * Get the total number of ads in this subcategory.
   */
  public function getTotalAdsCountAttribute(): int
  {
    // This will be implemented when we create the listings table
    // For now, return 0
    return 0;
  }
}
