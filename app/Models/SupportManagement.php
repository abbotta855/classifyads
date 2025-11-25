<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportManagement extends Model
{
    protected $table = 'support_management';

    protected $fillable = [
        'issue_error',
        'issue_reporter_id',
        'date',
        'assign_to_id',
        'assign_date',
        'error_status',
        'note_solution',
    ];

    protected $casts = [
        'date' => 'date',
        'assign_date' => 'date',
        'error_status' => 'string',
    ];

    public function issueReporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issue_reporter_id');
    }

    public function assignTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assign_to_id');
    }
}

