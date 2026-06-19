import { useState } from 'react'
import { reviewsApi } from '../api/reviews'

export default function GithubPostStatus({ review, onPosted }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handlePost = async () => {
    setLoading(true)
    setError(null)
    try {
      await reviewsApi.postToGithub(review.id)
      onPosted?.()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to post to GitHub')
    } finally {
      setLoading(false)
    }
  }

  if (review.posted_to_github) {
    const prUrl = review.pull_request
      ? `${review.pull_request.repository?.url}/pull/${review.pull_request.pr_number}`
      : null

    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
        <span className="text-green-600 text-lg">✅</span>
        <span className="text-sm font-medium text-green-700">Posted to GitHub PR</span>
        {prUrl && (
          <a
            href={prUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs text-blue-600 hover:underline font-medium"
          >
            View on GitHub →
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handlePost}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Posting to GitHub...
          </>
        ) : (
          <> 🐙 Post Review to GitHub PR </>
        )}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
