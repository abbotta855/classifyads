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
    'description',
    'price',
    'status',
    'featured',
    'posted_by',
    'views',
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

  public function photos()
  {
    return $this->hasMany(Photo::class)->orderBy('photo_order');
  }
}
