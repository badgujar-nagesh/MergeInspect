<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserApiKey extends Model
{
    protected $fillable = ['user_id', 'provider', 'key'];

    protected $hidden = ['key'];

    protected $casts = [
        'key' => 'encrypted',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
