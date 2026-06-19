<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class GitHubService
{
    private const BASE_URL = 'https://api.github.com';

    public function __construct(private readonly string $token) {}

    // ── Private ────────────────────────────────────────────────────────────

    private function headers(): array
    {
        return [
            'Authorization'        => 'Bearer ' . $this->token,
            'Accept'               => 'application/vnd.github+json',
            'X-GitHub-Api-Version' => '2022-11-28',
        ];
    }

    private function get(string $path, array $query = []): array
    {
        $response = Http::withHeaders($this->headers())
            ->get(self::BASE_URL . $path, $query);

        $response->throw();

        return $response->json();
    }

    private function post(string $path, array $body): array
    {
        $response = Http::withHeaders($this->headers())
            ->post(self::BASE_URL . $path, $body);

        $response->throw();

        return $response->json();
    }

    // ── Public API ─────────────────────────────────────────────────────────

    /**
     * Fetch PR metadata including head SHA needed for review API.
     */
    public function getPR(string $owner, string $repo, int $prNumber): array
    {
        return $this->get("/repos/{$owner}/{$repo}/pulls/{$prNumber}");
    }

    /**
     * Fetch all changed files (up to 100) with their patch/diff.
     */
    public function getPRFiles(string $owner, string $repo, int $prNumber): array
    {
        return $this->get("/repos/{$owner}/{$repo}/pulls/{$prNumber}/files", [
            'per_page' => 100,
        ]);
    }

    /**
     * Collapse all file patches into a single diff string for OpenAI.
     */
    public function buildDiffSummary(array $files): string
    {
        return collect($files)
            ->map(function (array $file) {
                $patch = $file['patch'] ?? '(binary file — no diff available)';
                return "### File: {$file['filename']} (+{$file['additions']} -{$file['deletions']})\n{$patch}";
            })
            ->join("\n\n---\n\n");
    }

    // ── Signature Feature ──────────────────────────────────────────────────

    /**
     * Post AI review findings back to the GitHub PR as an official Review
     * with inline diff comments on each finding that has a line number.
     *
     * Uses event=COMMENT so it never blocks the PR from being merged.
     */
    public function postReviewToPR(
        string $owner,
        string $repo,
        int    $prNumber,
        string $headSha,
        array  $findings,
        int    $overallScore,
    ): array {
        // Build inline comments only for findings that have a known line number
        $comments = collect($findings)
            ->filter(fn($f) => ! is_null($f->line_number))
            ->map(fn($f) => [
                'path' => $f->file_path,
                'line' => $f->line_number,
                'side' => 'RIGHT',
                'body' => $this->formatFindingComment($f),
            ])
            ->values()
            ->toArray();

        $payload = [
            'commit_id' => $headSha,
            'body'      => $this->buildReviewSummary($findings, $overallScore),
            'event'     => 'COMMENT',   // Never REQUEST_CHANGES — keeps merge unblocked
            'comments'  => $comments,
        ];

        return $this->post("/repos/{$owner}/{$repo}/pulls/{$prNumber}/reviews", $payload);
    }

    // ── Formatters ─────────────────────────────────────────────────────────

    private function formatFindingComment(object $finding): string
    {
        $emoji = match ($finding->severity) {
            'critical' => '🚨',
            'high'     => '⚠️',
            'medium'   => '🔶',
            'low'      => '🔵',
            default    => 'ℹ️',
        };

        $severity = strtoupper($finding->severity);
        $category = ucfirst($finding->category);

        return implode("\n", [
            "**{$emoji} [{$severity}] {$category} Issue — GitReview AI**",
            "",
            "**Issue:** {$finding->issue}",
            "",
            "**Recommendation:** {$finding->recommendation}",
            "",
            "---",
            "_Posted automatically by [GitReview AI](https://github.com)_",
        ]);
    }

    private function buildReviewSummary(array $findings, int $overallScore): string
    {
        $findings   = collect($findings);
        $critical   = $findings->where('severity', 'critical')->count();
        $high       = $findings->where('severity', 'high')->count();
        $medium     = $findings->where('severity', 'medium')->count();
        $low        = $findings->where('severity', 'low')->count();
        $total      = $findings->count();

        $scoreEmoji = $overallScore >= 80 ? '✅' : ($overallScore >= 60 ? '⚠️' : '🚨');

        return implode("\n", [
            "## 🤖 GitReview AI — Automated Code Review",
            "",
            "**{$scoreEmoji} Overall Score: {$overallScore}/100**",
            "",
            "| Severity   | Count |",
            "|------------|-------|",
            "| 🚨 Critical | {$critical} |",
            "| ⚠️ High     | {$high} |",
            "| 🔶 Medium   | {$medium} |",
            "| 🔵 Low      | {$low} |",
            "| **Total**  | **{$total}** |",
            "",
            "Inline comments have been added to each finding in the diff.",
            "",
            "> _This review was generated automatically by GitReview AI._",
        ]);
    }
}
