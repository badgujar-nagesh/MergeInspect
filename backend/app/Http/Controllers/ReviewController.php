<?php

namespace App\Http\Controllers;

use App\DTOs\ReviewRequestDto;
use App\Http\Requests\CreateReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\GithubToken;
use App\Models\Review;
use App\Services\GitHubService;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reviews = Review::with(['pullRequest.repository'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json([
            'data' => ReviewResource::collection($reviews->items()),
            'meta' => [
                'total'        => $reviews->total(),
                'current_page' => $reviews->currentPage(),
                'last_page'    => $reviews->lastPage(),
            ],
        ]);
    }

    public function store(CreateReviewRequest $request): JsonResponse
    {
        $githubToken = GithubToken::where('user_id', $request->user()->id)->first();

        if (! $githubToken) {
            return response()->json([
                'message' => 'Please save your GitHub Personal Access Token in Settings first.',
            ], 422);
        }

        $dto = new ReviewRequestDto(
            prUrl:        $request->pr_url,
            aiProvider:   $request->ai_provider,
            aiModel:      $request->ai_model,
            postToGithub: $request->boolean('post_to_github', false),
        );

        $reviewService = new ReviewService(
            new GitHubService($githubToken->token),
        );

        $review = $reviewService->runReview($dto, $request->user()->id);

        return response()->json([
            'message' => 'Review completed successfully',
            'data'    => new ReviewResource($review),
        ], 201);
    }

    public function show(Request $request, Review $review): JsonResponse
    {
        if ($review->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $review->load(['pullRequest.repository', 'findings']);

        return response()->json(['data' => new ReviewResource($review)]);
    }

    public function postToGithub(Request $request, Review $review): JsonResponse
    {
        if ($review->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($review->posted_to_github) {
            return response()->json(['message' => 'Already posted to GitHub'], 422);
        }

        $githubToken = GithubToken::where('user_id', $request->user()->id)->first();
        $review->load(['pullRequest.repository', 'findings']);

        $pr   = $review->pullRequest;
        $repo = $pr->repository;

        $githubService = new GitHubService($githubToken->token);
        $ghReview = $githubService->postReviewToPR(
            $repo->owner,
            $repo->name,
            $pr->pr_number,
            $pr->head_sha,
            $review->findings->all(),
            $review->overall_score,
        );

        $review->update([
            'posted_to_github' => true,
            'github_review_id' => $ghReview['id'],
        ]);

        return response()->json([
            'message'          => 'Review posted to GitHub successfully',
            'github_review_id' => $ghReview['id'],
        ]);
    }
}
