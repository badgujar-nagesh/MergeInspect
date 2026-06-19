<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'user_id',
        'pull_request_id',
        'overall_score',
        'security_score',
        'performance_score',
        'quality_score',
        'architecture_score',
        'ai_raw_response',
        'ai_provider',
        'ai_model',
        'posted_to_github',
        'github_review_id',
        'status',
    ];

    protected $casts = [
        'ai_raw_response'  => 'array',
        'posted_to_github' => 'boolean',
    ];

    public function user()        { return $this->belongsTo(User::class); }
    public function pullRequest() { return $this->belongsTo(PullRequest::class); }
    public function findings()    { return $this->hasMany(ReviewFinding::class); }
}
