<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobCategory extends Model
{
    protected $fillable = [
        'job_category_name',
        'category',
        'posted_job',
        'job_status',
    ];

    /**
     * Get all job applicants for this category
     */
    public function jobApplicants(): HasMany
    {
        return $this->hasMany(JobApplicant::class);
    }
}
