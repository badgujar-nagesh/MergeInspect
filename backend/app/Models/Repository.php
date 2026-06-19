<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Repository extends Model
{
    protected $fillable = ['user_id', 'url', 'owner', 'name'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pullRequests()
    {
        return $this->hasMany(PullRequest::class);
    }
}
