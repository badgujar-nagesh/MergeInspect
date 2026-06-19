<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateReviewRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'pr_url'         => ['required', 'url', 'regex:/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/'],
            'ai_provider'    => ['required', 'in:openai,claude'],
            'ai_model'       => ['required', 'string'],
            'post_to_github' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'pr_url.regex' => 'Please provide a valid GitHub PR URL: https://github.com/owner/repo/pull/NUMBER',
        ];
    }
}
