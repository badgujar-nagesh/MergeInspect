import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { reviewsApi } from '../api/reviews'

function ScorePill({ score }) {
  const cls = score >= 80 ? 'bg-green-100 text-green-700'
            : score >= 60 ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{score}/100</span>
}

export default function ReviewHistory() {
  const [reviews, setReviews] = useState([])
  const [meta, setMeta]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    reviewsApi.list()
      .then(res => {
        setReviews(res.data.data ?? [])
        setMeta(res.data.meta)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = reviews.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.pull_request?.repository?.name?.toLowerCase().includes(q) ||
      r.pull_request?.title?.toLowerCase().includes(q) ||
      String(r.pull_request?.pr_number).includes(q)
    )
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Review History</h1>
          <p className="text-gray-500 mt-1">{meta?.total ?? reviews.length} total reviews</p>
        </div>
        <Link
          to="/reviews/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Review
        </Link>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by repo, PR title, or number..."
        className="w-full mb-6 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-5xl mb-3">🔍</p>
          <p className="font-medium text-gray-600">No reviews found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search ? 'Try a different search term' : 'Analyze your first PR to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => {
            const pr   = review.pull_request
            const repo = pr?.repository

            return (
              <Link
                key={review.id}
                to={`/reviews/${review.id}`}
                className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {repo?.owner}/{repo?.name} <span className="text-gray-400">#{pr?.pr_number}</span>
                    </p>
                    {review.posted_to_github && (
                      <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full font-medium">
                        ✅ GitHub
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 truncate">{pr?.title ?? '—'}</p>
                  <div className="flex gap-3 mt-2">
                    {[
                      { label: '🔒', score: review.security_score },
                      { label: '⚡', score: review.performance_score },
                      { label: '📐', score: review.quality_score },
                      { label: '🏗️', score: review.architecture_score },
                    ].map(({ label, score }) => (
                      <span key={label} className="text-xs text-gray-500">
                        {label} {score}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-6 shrink-0">
                  <ScorePill score={review.overall_score} />
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-gray-400 group-hover:text-blue-600 transition-colors">→</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
