<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobCategory extends Model
{
    protected $fillable = [
        'category',
        'sub_category',
        'posted_job',
        'job_status',
    ];
}
