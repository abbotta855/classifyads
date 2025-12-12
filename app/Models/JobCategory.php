<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobCategory extends Model
{
    protected $fillable = [
        'job_category_name',
        'category',
        'posted_job',
        'job_status',
    ];
}
