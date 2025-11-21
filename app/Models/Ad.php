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
  ];

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  public function category(): BelongsTo
  {
    return $this->belongsTo(Category::class);
  }
}
