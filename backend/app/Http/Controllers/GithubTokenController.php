<?php

namespace App\Http\Controllers;

use App\Http\Requests\GithubTokenRequest;
use App\Models\GithubToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GithubTokenController extends Controller
{
    public function store(GithubTokenRequest $request): JsonResponse
    {
        $token = GithubToken::updateOrCreate(
            ['user_id' => $request->user()->id],
            ['token' => $request->token]
        );

        return response()->json([
            'message' => 'GitHub token saved successfully',
            'has_token' => true,
        ]);
    }

    public function show(Request $request): JsonResponse
    {
        $hasToken = GithubToken::where('user_id', $request->user()->id)->exists();

        return response()->json(['has_token' => $hasToken]);
    }
}
