<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewFindingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'category'          => $this->category,
            'severity'          => $this->severity,
            'file_path'         => $this->file_path,
            'line_number'       => $this->line_number,
            'issue'             => $this->issue,
            'recommendation'    => $this->recommendation,
            'github_comment_id' => $this->github_comment_id,
        ];
    }
}
