<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedSearch extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'search_query',
        'category_id',
        'location_id',
        'min_price',
        'max_price',
        'filters',
        'is_active',
        'alert_count',
        'last_alert_at',
    ];

    protected $casts = [
        'filters' => 'array',
        'is_active' => 'boolean',
        'min_price' => 'decimal:2',
        'max_price' => 'decimal:2',
        'alert_count' => 'integer',
        'last_alert_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the saved search
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the category for this search
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the location for this search
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
