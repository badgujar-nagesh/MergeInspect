<?php

namespace App\Http\Controllers;

use App\Models\UserApiKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiKeyController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'provider' => ['required', 'in:openai,claude'],
            'key'      => ['required', 'string', 'min:10'],
        ]);

        UserApiKey::updateOrCreate(
            ['user_id' => $request->user()->id, 'provider' => $request->provider],
            ['key' => $request->key]
        );

        return response()->json([
            'message' => ucfirst($request->provider) . ' API key saved successfully.',
            'has_key' => true,
        ]);
    }

    public function show(Request $request, string $provider): JsonResponse
    {
        if (! in_array($provider, ['openai', 'claude'])) {
            return response()->json(['message' => 'Invalid provider'], 422);
        }

        $hasKey = UserApiKey::where('user_id', $request->user()->id)
            ->where('provider', $provider)
            ->exists();

        return response()->json(['has_key' => $hasKey]);
    }
}
