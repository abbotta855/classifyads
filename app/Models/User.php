<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'location_id',
        'selected_local_address',
        'comment',
        'otp_code',
        'otp_expires_at',
        'is_verified',
        'seller_verified',
        'seller_verification_fee_paid',
        'seller_verification_payment_id',
        'seller_verification_payment_method',
        'card_linked',
        'e_wallet_linked',
        'seller_verified_at',
        'dob',
        'phone',
        'show_phone',
        'profile_picture',
        'last_login_at',
        'timezone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'otp_expires_at' => 'datetime',
            'is_verified' => 'boolean',
            'seller_verified' => 'boolean',
            'seller_verification_fee_paid' => 'boolean',
            'card_linked' => 'boolean',
            'e_wallet_linked' => 'boolean',
            'seller_verified_at' => 'datetime',
            'dob' => 'date',
            'show_phone' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is regular user
     */
    public function isUser(): bool
    {
        return $this->role === 'user';
    }

    /**
     * Get all ads created by this user
     */
    public function ads()
    {
        return $this->hasMany(Ad::class);
    }

    /**
     * Get all transactions for this user
     */
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get all notifications for this user
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get all user notifications (custom notifications table)
     */
    public function userNotifications()
    {
        return $this->hasMany(UserNotification::class)->orderBy('created_at', 'desc');
    }

    /**
     * Get all favourites for this user
     */
    public function favourites()
    {
        return $this->hasMany(Favourite::class)->orderBy('created_at', 'desc');
    }

    /**
     * Get all watchlist items for this user
     */
    public function watchlists()
    {
        return $this->hasMany(Watchlist::class)->orderBy('created_at', 'desc');
    }

    /**
     * Get all recently viewed items for this user
     */
    public function recentlyViewed()
    {
        return $this->hasMany(RecentlyViewed::class)->orderBy('viewed_at', 'desc');
    }

    /**
     * Get all saved searches for this user
     */
    public function savedSearches()
    {
        return $this->hasMany(SavedSearch::class)->orderBy('created_at', 'desc');
    }

    /**
     * Get all ratings given by this user (as buyer)
     */
    public function ratingsGiven()
    {
        return $this->hasMany(Rating::class, 'user_id')->orderBy('created_at', 'desc');
    }

    /**
     * Get all ratings received by this user (as seller)
     */
    public function ratingsReceived()
    {
        return $this->hasMany(Rating::class, 'seller_id')->orderBy('created_at', 'desc');
    }

    /**
     * Get all ebooks created by this user
     */
    public function ebooks()
    {
        return $this->hasMany(Ebook::class);
    }

    /**
     * Get all auctions created by this user (as seller)
     */
    public function createdAuctions()
    {
        return $this->hasMany(Auction::class, 'user_id');
    }

    /**
     * Get all auctions won by this user
     */
    public function wonAuctions()
    {
        return $this->hasMany(Auction::class, 'winner_id');
    }

    /**
     * Get all bids placed by this user
     */
    public function bids()
    {
        return $this->hasMany(Bid::class);
    }

    /**
     * Get the location for this user
     */
    public function locationRelation()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    /**
     * Boot method to enforce single super admin rule
     */
    protected static function boot()
    {
        parent::boot();

        // Before creating a user, check if trying to create super_admin
        static::creating(function ($user) {
            if ($user->role === 'super_admin') {
                $existingSuperAdmin = static::where('role', 'super_admin')->first();
                if ($existingSuperAdmin) {
                    throw new \Exception('Only 1 super admin is allowed in the system. An existing super admin already exists.');
                }
            }
        });

        // Before updating a user, check if trying to upgrade to super_admin
        static::updating(function ($user) {
            if ($user->isDirty('role') && $user->role === 'super_admin') {
                // Check if another super admin exists (excluding current user)
                $existingSuperAdmin = static::where('role', 'super_admin')
                    ->where('id', '!=', $user->id)
                    ->first();
                if ($existingSuperAdmin) {
                    throw new \Exception('Only 1 super admin is allowed in the system. An existing super admin already exists.');
                }
            }
        });
    }
}
