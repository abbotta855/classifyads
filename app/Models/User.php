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
        'dob',
        'phone',
        'profile_picture',
        'last_login_at',
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
            'dob' => 'date',
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
     * Get the location for this user
     */
    public function locationRelation()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }
}
