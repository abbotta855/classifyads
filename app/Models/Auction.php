<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Auction extends Model
{
  protected $fillable = [
    'ad_id',
    'user_id',
    'category_id',
    'location_id',
    'title',
    'description',
    'slug',
    'starting_price',
    'reserve_price',
    'buy_now_price',
    'current_bid_price',
    'current_bidder_id',
    'bid_increment',
    'start_time',
    'end_time',
    'start_date_time', // Keep for backward compatibility
    'end_date_time', // Keep for backward compatibility
    'status',
    'winner_id',
    'winner_notified_at',
    'payment_completed_at',
    'image1_url',
    'image2_url',
    'image3_url',
    'image4_url',
    'views',
    'self_pickup',
    'seller_delivery',
    'payment_methods',
    'financing_available',
    'financing_terms',
  ];

  protected $casts = [
    'starting_price' => 'decimal:2',
    'reserve_price' => 'decimal:2',
    'buy_now_price' => 'decimal:2',
    'current_bid_price' => 'decimal:2',
    'bid_increment' => 'decimal:2',
    'start_time' => 'datetime',
    'end_time' => 'datetime',
    'start_date_time' => 'datetime', // Alias for start_time
    'end_date_time' => 'datetime', // Alias for end_time
    'winner_notified_at' => 'datetime',
    'payment_completed_at' => 'datetime',
    'views' => 'integer',
    'self_pickup' => 'boolean',
    'seller_delivery' => 'boolean',
    'payment_methods' => 'array',
    'financing_available' => 'boolean',
    'financing_terms' => 'array',
  ];

  /**
   * Accessor for start_date_time (maps to start_time)
   */
  public function getStartDateTimeAttribute()
  {
    return $this->start_time;
  }

  /**
   * Mutator for start_date_time (maps to start_time)
   */
  public function setStartDateTimeAttribute($value)
  {
    $this->attributes['start_time'] = $value;
  }

  /**
   * Accessor for end_date_time (maps to end_time)
   */
  public function getEndDateTimeAttribute()
  {
    return $this->end_time;
  }

  /**
   * Mutator for end_date_time (maps to end_time)
   */
  public function setEndDateTimeAttribute($value)
  {
    $this->attributes['end_time'] = $value;
  }

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

  public function ad(): BelongsTo
  {
    return $this->belongsTo(Ad::class);
  }

  public function currentBidder(): BelongsTo
  {
    return $this->belongsTo(User::class, 'current_bidder_id');
  }

  public function winner(): BelongsTo
  {
    return $this->belongsTo(User::class, 'winner_id');
  }

  public function bids(): HasMany
  {
    return $this->hasMany(Bid::class)->orderBy('bid_amount', 'desc');
  }

  public function transactions(): HasMany
  {
    return $this->hasMany(Transaction::class);
  }

  public function messages(): HasMany
  {
    return $this->hasMany(BuyerSellerMessage::class);
  }

  /**
   * Check if auction is currently active
   */
  public function isActive(): bool
  {
    // Check actual times, not just status field
    // Status field might not be updated yet by scheduled commands
    $now = now();
    
    // If status is ended or completed, it's definitely not active
    if ($this->status === 'ended' || $this->status === 'completed') {
      return false;
    }
    
    // Auction is active if start_time has passed and end_time hasn't
    return $this->start_time <= $now && $this->end_time > $now;
  }

  /**
   * Check if auction has ended
   */
  public function isEnded(): bool
  {
    return $this->status === 'ended' || $this->end_time <= now();
  }

  /**
   * Check if auction is pending (not started yet)
   */
  public function isPending(): bool
  {
    return $this->status === 'pending' && $this->start_time > now();
  }

  /**
   * Get the highest bid
   */
  public function getHighestBid()
  {
    return $this->bids()->where('is_winning_bid', true)->first();
  }

  /**
   * Get total bid count
   */
  public function getBidCount(): int
  {
    return $this->bids()->count();
  }

  /**
   * Get time remaining in seconds
   */
  public function getTimeRemaining(): int
  {
    if ($this->isEnded()) {
      return 0;
    }
    return max(0, $this->end_time->diffInSeconds(now()));
  }

  /**
   * Calculate next minimum bid amount
   */
  public function getNextMinimumBid(): float
  {
    $currentBid = $this->current_bid_price ?? $this->starting_price;
    return $currentBid + $this->bid_increment;
  }

  /**
   * Generate SEO-friendly slug from title (reuse ad slug pattern)
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
   * Increment view count (reuse ad view pattern)
   */
  public function incrementView(): void
  {
    $this->increment('views');
  }

  /**
   * Scopes
   */
  public function scopeActive($query)
  {
    return $query->where('status', 'active')
      ->where('start_time', '<=', now())
      ->where('end_time', '>', now());
  }

  public function scopeEnded($query)
  {
    return $query->where('status', 'ended')
      ->orWhere('end_time', '<=', now());
  }

  public function scopePending($query)
  {
    return $query->where('status', 'pending')
      ->where('start_time', '>', now());
  }

  public function scopeByCategory($query, $categoryId)
  {
    return $query->where('category_id', $categoryId);
  }

  public function scopeByLocation($query, $locationId)
  {
    return $query->where('location_id', $locationId);
  }
}
