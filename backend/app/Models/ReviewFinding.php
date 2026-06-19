<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReviewFinding extends Model
{
    protected $fillable = [
        'review_id',
        'category',
        'severity',
        'file_path',
        'line_number',
        'issue',
        'recommendation',
        'github_comment_id',
    ];

    public function review()
    {
        return $this->belongsTo(Review::class);
    }
}
