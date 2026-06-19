import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { reviewsApi } from '../api/reviews'
import ScoreCard         from '../components/ScoreCard'
import FindingsList      from '../components/FindingsList'
import GithubPostStatus  from '../components/GithubPostStatus'

const CATEGORY_FILTERS = ['all', 'security', 'performance', 'quality', 'architecture']
const SEVERITY_FILTERS = ['all', 'critical', 'high', 'medium', 'low', 'info']

export default function ReviewDetail() {
  const { id }                    = useParams()
  const [review, setReview]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [catFilter, setCatFilter] = useState('all')
  const [sevFilter, setSevFilter] = useState('all')

  const fetchReview = useCallback(() => {
    setLoading(true)
    reviewsApi.get(id)
      .then(res => setReview(res.data.data))
      .catch(() => setError('Failed to load review.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { fetchReview() }, [fetchReview])

  if (loading) return <div className="p-8 text-gray-400">Loading review...</div>
  if (error)   return <div className="p-8 text-red-600">{error}</div>
  if (!review) return null

  const pr   = review.pull_request
  const repo = pr?.repository

  const filteredFindings = (review.findings ?? []).filter(f => {
    if (catFilter !== 'all' && f.category !== catFilter) return false
    if (sevFilter !== 'all' && f.severity !== sevFilter) return false
    return true
  })

  const countBySeverity = (sev) => (review.findings ?? []).filter(f => f.severity === sev).length

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link to="/reviews" className="text-sm text-blue-600 hover:underline mb-3 inline-block">← Back to History</Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {repo?.name ?? 'Repository'} #{pr?.pr_number}
            </h1>
            <p className="text-gray-500 mt-1">{pr?.title ?? '—'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {pr?.author && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  👤 {pr.author}
                </span>
              )}
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                {pr?.state ?? 'open'}
              </span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {new Date(review.created_at).toLocaleString()}
              </span>
            </div>
          </div>
          {/* GitHub post status */}
          <GithubPostStatus review={review} onPosted={fetchReview} />
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="col-span-2 lg:col-span-1">
          <ScoreCard label="Overall"      score={review.overall_score}      icon="🏆" />
        </div>
        <ScoreCard label="Security"       score={review.security_score}      icon="🔒" />
        <ScoreCard label="Performance"    score={review.performance_score}   icon="⚡" />
        <ScoreCard label="Code Quality"   score={review.quality_score}       icon="📐" />
        <ScoreCard label="Architecture"   score={review.architecture_score}  icon="🏗️" />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Critical', sev: 'critical', color: 'text-red-600 bg-red-50 border-red-200' },
          { label: 'High',     sev: 'high',     color: 'text-orange-600 bg-orange-50 border-orange-200' },
          { label: 'Medium',   sev: 'medium',   color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
          { label: 'Low',      sev: 'low',      color: 'text-blue-600 bg-blue-50 border-blue-200' },
        ].map(({ label, sev, color }) => (
          <div key={sev} className={`border rounded-xl p-4 text-center ${color}`}>
            <p className="text-2xl font-bold">{countBySeverity(sev)}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {review.ai_raw_response?.summary && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs font-semibold text-blue-600 mb-1">🤖 AI Summary</p>
          <p className="text-sm text-blue-900">{review.ai_raw_response.summary}</p>
        </div>
      )}

      {/* Findings */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Findings ({filteredFindings.length})
          </h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORY_FILTERS.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <select
              value={sevFilter}
              onChange={e => setSevFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SEVERITY_FILTERS.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All severities' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <FindingsList findings={filteredFindings} />
      </div>
    </div>
  )
}
