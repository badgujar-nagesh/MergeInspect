<?php

namespace App\Services;

use App\DTOs\ReviewRequestDto;
use App\Models\PullRequest;
use App\Models\Repository;
use App\Models\Review;
use App\Models\ReviewFinding;
use App\Models\UserApiKey;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReviewService
{
    public function __construct(
        private readonly GitHubService $github,
    ) {}

    public function runReview(ReviewRequestDto $dto, int $userId): Review
    {
        // 1. Resolve the correct AI service based on provider + user's saved key
        $aiService = $this->resolveAIService($dto, $userId);

        // 2. Fetch PR data from GitHub
        $prData = $this->github->getPR($dto->owner, $dto->repo, $dto->prNumber);
        $files  = $this->github->getPRFiles($dto->owner, $dto->repo, $dto->prNumber);
        $diff   = $this->github->buildDiffSummary($files);

        // 3. Upsert Repository + PullRequest
        $repository = Repository::firstOrCreate(
            ['url' => "https://github.com/{$dto->owner}/{$dto->repo}"],
            ['owner' => $dto->owner, 'name' => $dto->repo, 'user_id' => $userId]
        );

        $pullRequest = PullRequest::updateOrCreate(
            ['repository_id' => $repository->id, 'pr_number' => $dto->prNumber],
            [
                'title'    => $prData['title'],
                'author'   => $prData['user']['login'],
                'head_sha' => $prData['head']['sha'],
                'state'    => $prData['state'],
            ]
        );

        // 4. Call AI service
        $aiResult = $aiService->reviewDiff($diff);

        // 5. Persist review + findings in a transaction
        $review = DB::transaction(function () use ($aiResult, $userId, $pullRequest, $dto) {
            $review = Review::create([
                'user_id'            => $userId,
                'pull_request_id'    => $pullRequest->id,
                'overall_score'      => $aiResult['overall_score'],
                'security_score'     => $aiResult['security_score'],
                'performance_score'  => $aiResult['performance_score'],
                'quality_score'      => $aiResult['quality_score'],
                'architecture_score' => $aiResult['architecture_score'],
                'ai_raw_response'    => $aiResult,
                'ai_provider'        => $dto->aiProvider,
                'ai_model'           => $dto->aiModel,
                'status'             => 'completed',
            ]);

            foreach ($aiResult['findings'] as $f) {
                ReviewFinding::create([
                    'review_id'      => $review->id,
                    'category'       => $f['category'],
                    'severity'       => $f['severity'],
                    'file_path'      => $f['file_path'],
                    'line_number'    => $f['line_number'],
                    'issue'          => $f['issue'],
                    'recommendation' => $f['recommendation'],
                ]);
            }

            return $review;
        });

        $review->load('findings');

        // 6. Signature Feature: post review comments back to GitHub PR
        if ($dto->postToGithub) {
            try {
                $ghReview = $this->github->postReviewToPR(
                    owner:        $dto->owner,
                    repo:         $dto->repo,
                    prNumber:     $dto->prNumber,
                    headSha:      $pullRequest->head_sha,
                    findings:     $review->findings->all(),
                    overallScore: $aiResult['overall_score'],
                );

                $review->update([
                    'posted_to_github' => true,
                    'github_review_id' => $ghReview['id'],
                ]);

                $review->refresh();
            } catch (\Throwable $e) {
                Log::error('Failed to post review to GitHub', [
                    'review_id' => $review->id,
                    'error'     => $e->getMessage(),
                ]);
            }
        }

        return $review->load('findings');
    }

    private function resolveAIService(ReviewRequestDto $dto, int $userId): OpenAIService|ClaudeService
    {
        $record = UserApiKey::where('user_id', $userId)
            ->where('provider', $dto->aiProvider)
            ->firstOrFail();

        return match ($dto->aiProvider) {
            'openai' => new OpenAIService($record->key, $dto->aiModel),
            'claude' => new ClaudeService($record->key, $dto->aiModel),
            default  => throw new \InvalidArgumentException("Unknown AI provider: {$dto->aiProvider}"),
        };
    }
}
