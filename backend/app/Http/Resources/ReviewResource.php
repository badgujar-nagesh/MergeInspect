<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $pr   = $this->whenLoaded('pullRequest');
        $repo = $pr ? $pr->whenLoaded('repository') : null;

        return [
            'id'                 => $this->id,
            'overall_score'      => $this->overall_score,
            'security_score'     => $this->security_score,
            'performance_score'  => $this->performance_score,
            'quality_score'      => $this->quality_score,
            'architecture_score' => $this->architecture_score,
            'status'             => $this->status,
            'posted_to_github'   => $this->posted_to_github,
            'github_review_id'   => $this->github_review_id,
            'created_at'         => $this->created_at?->toIso8601String(),
            'pull_request'       => $this->whenLoaded('pullRequest', fn() => [
                'pr_number' => $pr->pr_number,
                'title'     => $pr->title,
                'author'    => $pr->author,
                'state'     => $pr->state,
                'head_sha'  => $pr->head_sha,
                'repository' => $this->whenLoaded('pullRequest', fn() => $pr->relationLoaded('repository') ? [
                    'url'   => $pr->repository->url,
                    'owner' => $pr->repository->owner,
                    'name'  => $pr->repository->name,
                ] : null),
            ]),
            'findings'           => ReviewFindingResource::collection($this->whenLoaded('findings')),
        ];
    }
}
