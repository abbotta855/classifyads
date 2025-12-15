<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ebook extends Model
{
    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'description',
        'writer',
        'language',
        'pages',
        'book_size',
        'file_format',
        'file_url',
        'file_name',
        'file_size',
        'file_type',
        'cover_image',
        'price',
        'publisher_name',
        'publisher_address',
        'publisher_website',
        'publisher_email',
        'publisher_phone',
        'copyright_declared',
        'book_type',
        'shipping_cost',
        'delivery_time',
        'overall_rating',
        'download_count',
        'purchase_count',
        'status',
        'unlocked',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'overall_rating' => 'decimal:2',
        'copyright_declared' => 'boolean',
        'unlocked' => 'boolean',
        'pages' => 'integer',
        'download_count' => 'integer',
        'purchase_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get formatted file size
     */
    public function getFormattedFileSizeAttribute(): string
    {
        if (!$this->file_size) {
            return 'Unknown';
        }

        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Check if user has purchased this ebook
     */
    public function isPurchasedBy(int $userId): bool
    {
        return $this->transactions()
            ->where('user_id', $userId)
            ->where('type', 'ebook_purchase')
            ->where('status', 'completed')
            ->exists();
    }

    /**
     * Get verification code for a user's purchase
     */
    public function getVerificationCodeForUser(int $userId): ?string
    {
        $transaction = $this->transactions()
            ->where('user_id', $userId)
            ->where('type', 'ebook_purchase')
            ->where('status', 'completed')
            ->first();
        
        return $transaction?->verification_code;
    }
}
