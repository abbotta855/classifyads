<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobCategory extends Model
{
    protected $fillable = [
        'category_id',
        'category',
        'sub_category',
        'posted_job',
        'job_status',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
