<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PullRequest extends Model
{
    protected $fillable = [
        'repository_id',
        'pr_number',
        'title',
        'author',
        'head_sha',
        'state',
    ];

    public function repository()
    {
        return $this->belongsTo(Repository::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}
