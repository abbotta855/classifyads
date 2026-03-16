<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockManagement extends Model
{
    protected $table = 'stock_management';

    protected $fillable = [
        'item_name',
        'vendor_seller_id',
        'category_id',
        'quantity',
        'sold_item_qty',
        'low_stock_threshold',
        'low_stock_alert_sent',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'sold_item_qty' => 'integer',
        'low_stock_threshold' => 'integer',
        'low_stock_alert_sent' => 'boolean',
    ];

    public function vendorSeller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_seller_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Check if stock is low
     */
    public function isLowStock(): bool
    {
        return $this->quantity <= $this->low_stock_threshold;
    }
}

