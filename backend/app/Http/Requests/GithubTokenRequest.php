<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GithubTokenRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'token' => ['required', 'string', 'min:10'],
        ];
    }
}
