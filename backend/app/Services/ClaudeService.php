<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClaudeService
{
    private const API_URL        = 'https://api.anthropic.com/v1/messages';
    private const ANTHROPIC_VER  = '2023-06-01';
    private const MAX_TOKENS     = 4096;

    private string $systemPrompt = <<<'PROMPT'
You are a Senior Software Architect and Security Engineer with 15+ years of experience.
Review the provided GitHub Pull Request diff carefully.

Analyze for:
1. Security Issues — SQL injection, XSS, CSRF, insecure direct object references, exposed secrets, improper auth
2. Performance Problems — N+1 queries, inefficient loops, missing indexes, heavy operations in loops
3. Code Quality — large methods (>20 lines), duplicate logic, poor naming, dead code, missing error handling
4. Architecture Issues — SOLID violations, tight coupling, missing service layer, fat controllers

Rules:
- Only report REAL issues visible in the diff. Do not hallucinate.
- Provide the exact file_path and line_number when possible (line in the NEW file).
- If line number is unknown, set line_number to null.
- severity: critical | high | medium | low | info
- category: security | performance | quality | architecture

Return ONLY valid JSON — no markdown, no code fences, no text outside the JSON object.

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
      "issue": "Raw SQL query with unescaped user input.",
      "recommendation": "Use Eloquent ORM or parameterised query builder."
    }
  ]
}
PROMPT;

    public function __construct(private readonly string $apiKey, private readonly string $model) {}

    public function reviewDiff(string $diff): array
    {
        $truncatedDiff = mb_substr($diff, 0, 28000);

        $response = Http::withHeaders([
            'x-api-key'         => $this->apiKey,
            'anthropic-version' => self::ANTHROPIC_VER,
            'content-type'      => 'application/json',
        ])
        ->timeout(120)
        ->post(self::API_URL, [
            'model'      => $this->model,
            'max_tokens' => self::MAX_TOKENS,
            'system'     => $this->systemPrompt,
            'messages'   => [
                ['role' => 'user', 'content' => "Review this GitHub Pull Request diff:\n\n{$truncatedDiff}"],
            ],
        ]);

        $response->throw();

        $text = $response->json('content.0.text') ?? '';

        // Strip any accidental markdown fences
        $text = preg_replace('/^```(?:json)?\s*/m', '', $text);
        $text = preg_replace('/^```\s*$/m', '', $text);

        $result = json_decode(trim($text), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Claude returned invalid JSON', ['response' => $response->body()]);
            throw new \RuntimeException('Claude returned invalid JSON response.');
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
