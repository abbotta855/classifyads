<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ad extends Model
{
  protected $fillable = [
    'user_id',
    'category_id',
    'title',
    'slug',
    'description',
    'price',
    'status',
    'featured',
    'posted_by',
    'views',
    'location_id',
    'selected_local_address_index',
    'image1_url',
    'image2_url',
    'image3_url',
    'image4_url',
  ];

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  public function category(): BelongsTo
  {
    return $this->belongsTo(Category::class);
  }

  public function location(): BelongsTo
  {
    return $this->belongsTo(Location::class);
  }

  public function photos()
  {
    return $this->hasMany(Photo::class)->orderBy('photo_order');
  }

  /**
   * Get all users who favourited this ad
   */
  public function favouritedBy()
  {
    return $this->hasMany(Favourite::class);
  }

  /**
   * Get all users watching this ad
   */
  public function watchedBy()
  {
    return $this->hasMany(Watchlist::class);
  }

  /**
   * Get all users who recently viewed this ad
   */
  public function recentlyViewedBy()
  {
    return $this->hasMany(RecentlyViewed::class);
  }

  /**
   * Get all clicks on this ad
   */
  public function clicks()
  {
    return $this->hasMany(AdClick::class);
  }

  /**
   * Get all buyer-seller messages for this ad
   */
  public function buyerSellerMessages()
  {
    return $this->hasMany(\App\Models\BuyerSellerMessage::class);
  }

  /**
   * Generate a unique slug from the title
   */
  public static function generateSlug($title, $excludeId = null)
  {
    $slug = \Illuminate\Support\Str::slug($title);
    $originalSlug = $slug;
    $counter = 1;

    while (self::where('slug', $slug)
      ->when($excludeId, function ($query) use ($excludeId) {
        return $query->where('id', '!=', $excludeId);
      })
      ->exists()) {
      $slug = $originalSlug . '-' . $counter;
      $counter++;
    }

    return $slug;
  }

  /**
   * Boot method to auto-generate slug
   */
  protected static function boot()
  {
    parent::boot();

    static::creating(function ($ad) {
      if (empty($ad->slug) && !empty($ad->title)) {
        $ad->slug = self::generateSlug($ad->title);
      }
    });

    static::updating(function ($ad) {
      // Regenerate slug if title changed and slug is empty or needs update
      if ($ad->isDirty('title') && (empty($ad->slug) || $ad->slug === '')) {
        $ad->slug = self::generateSlug($ad->title, $ad->id);
      }
    });
  }
}
