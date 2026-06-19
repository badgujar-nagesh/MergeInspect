<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIService
{
    private const API_URL = 'https://api.openai.com/v1/chat/completions';

    private string $systemPrompt = <<<'PROMPT'
You are a Senior Software Architect and Security Engineer with 15+ years of experience.
Review the provided GitHub Pull Request diff carefully.

Analyze for:
1. Security Issues — SQL injection, XSS, CSRF, insecure direct object references, exposed secrets, improper auth
2. Performance Problems — N+1 queries, inefficient loops, missing indexes, heavy operations in loops
3. Code Quality — large methods (>20 lines), duplicate logic, poor naming, dead code, missing error handling
4. Architecture Issues — SOLID violations, tight coupling, missing service layer, fat controllers

Rules:
- Only report REAL issues you can see in the diff. Do not hallucinate.
- Provide the exact file_path and line_number from the diff when possible.
- line_number must be the line number in the NEW file (right side of diff).
- If you cannot determine the exact line, set line_number to null.
- severity must be one of: critical, high, medium, low, info
- category must be one of: security, performance, quality, architecture

Return ONLY valid JSON. No markdown, no code fences, no explanation outside JSON.

JSON schema:
{
  "overall_score": 85,
  "security_score": 90,
  "performance_score": 80,
  "quality_score": 85,
  "architecture_score": 82,
  "summary": "Brief 2-3 sentence overall assessment.",
  "findings": [
    {
      "category": "security",
      "severity": "high",
      "file_path": "app/Http/Controllers/UserController.php",
      "line_number": 45,
      "issue": "Raw SQL query with unescaped user input creates SQL injection vulnerability.",
      "recommendation": "Use Eloquent ORM or Laravel's query builder with parameter binding."
    }
  ]
}
PROMPT;

    public function __construct(private readonly string $apiKey, private readonly string $model) {}

    public function reviewDiff(string $diff): array
    {
        $truncatedDiff = mb_substr($diff, 0, 28000);

        $response = Http::withToken($this->apiKey)
            ->timeout(120)
            ->post(self::API_URL, [
                'model'           => $this->model,
                'temperature'     => 0.2,
                'response_format' => ['type' => 'json_object'],
                'messages'        => [
                    ['role' => 'system', 'content' => $this->systemPrompt],
                    ['role' => 'user',   'content' => "Review this GitHub Pull Request diff:\n\n{$truncatedDiff}"],
                ],
            ]);

        $response->throw();

        $result = json_decode($response->json('choices.0.message.content'), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('OpenAI returned invalid JSON', ['response' => $response->body()]);
            throw new \RuntimeException('OpenAI returned invalid JSON response.');
        }

        return $this->normalize($result);
    }

    private function normalize(array $result): array
    {
        return [
            'overall_score'      => $result['overall_score']      ?? 50,
            'security_score'     => $result['security_score']     ?? 50,
            'performance_score'  => $result['performance_score']  ?? 50,
            'quality_score'      => $result['quality_score']      ?? 50,
            'architecture_score' => $result['architecture_score'] ?? 50,
            'summary'            => $result['summary']            ?? '',
            'findings'           => array_map(fn($f) => [
                'category'       => $f['category']       ?? 'quality',
                'severity'       => $f['severity']       ?? 'info',
                'file_path'      => $f['file_path']      ?? 'unknown',
                'line_number'    => $f['line_number']    ?? null,
                'issue'          => $f['issue']          ?? '',
                'recommendation' => $f['recommendation'] ?? '',
            ], $result['findings'] ?? []),
        ];
    }
}
