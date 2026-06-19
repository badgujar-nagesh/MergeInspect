<?php

namespace App\DTOs;

class ReviewRequestDto
{
    public readonly string $owner;
    public readonly string $repo;
    public readonly int    $prNumber;

    public function __construct(
        public readonly string $prUrl,
        public readonly string $aiProvider,
        public readonly string $aiModel,
        public readonly bool   $postToGithub = false,
    ) {
        // Parse owner/repo/prNumber from URL at construction time
        preg_match('/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/', $prUrl, $m);
        $this->owner    = $m[1] ?? '';
        $this->repo     = $m[2] ?? '';
        $this->prNumber = isset($m[3]) ? (int) $m[3] : 0;
    }
}
