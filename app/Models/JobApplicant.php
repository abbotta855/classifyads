<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobApplicant extends Model
{
    protected $fillable = [
        'job_title',
        'posted_date',
        'expected_salary',
        'applicant_name',
        'interview_date',
        'job_progress',
    ];
}
