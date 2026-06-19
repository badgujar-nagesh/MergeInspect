<?php

namespace App\DTOs;

class GithubPRDto
{
    public function __construct(
        public readonly string $owner,
        public readonly string $repo,
        public readonly int    $prNumber,
        public readonly string $title,
        public readonly string $author,
        public readonly string $headSha,
        public readonly string $state,
        public readonly string $diff,
    ) {}
}
