<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GithubTokenController;
use App\Http\Controllers\ApiKeyController;
use App\Http\Controllers\ReviewController;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // GitHub PAT
    Route::post('/github-token', [GithubTokenController::class, 'store']);
    Route::get('/github-token',  [GithubTokenController::class, 'show']);

    // AI API keys (openai / claude)
    Route::post('/api-keys',           [ApiKeyController::class, 'store']);
    Route::get('/api-keys/{provider}', [ApiKeyController::class, 'show']);

    // Reviews
    Route::get('/reviews',                          [ReviewController::class, 'index']);
    Route::post('/reviews',                         [ReviewController::class, 'store']);
    Route::get('/reviews/{review}',                 [ReviewController::class, 'show']);
    Route::post('/reviews/{review}/post-to-github', [ReviewController::class, 'postToGithub']);
});
