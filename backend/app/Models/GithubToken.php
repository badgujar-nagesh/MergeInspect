<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GithubToken extends Model
{
    protected $fillable = ['user_id', 'token'];

    protected $hidden = ['token'];

    protected $casts = [
        'token' => 'encrypted',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
