<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplicant extends Model
{
    protected $fillable = [
        'job_title',
        'posted_date',
        'expected_salary',
        'applicant_name',
        'cv_file_url',
        'cover_letter_file_url',
        'reference_letter_file_url',
        'interview_date',
        'job_progress',
        'job_category_id',
    ];

    /**
     * Get the job category that this applicant belongs to
     */
    public function jobCategory(): BelongsTo
    {
        return $this->belongsTo(JobCategory::class);
    }
}
