<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyticsEvent extends Model
{
    protected $fillable = [
        'user_id',
        'event_type',
        'event_category',
        'event_name',
        'event_data',
        'page_url',
        'referrer',
        'user_agent',
        'ip_address',
    ];

    protected $casts = [
        'event_data' => 'array',
    ];

    /**
     * Get the user who triggered the event
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

