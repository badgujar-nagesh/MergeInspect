import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { reviewsApi } from '../api/reviews'
import { useAuth } from '../context/AuthContext'

function StatCard({ label, value, icon, color }) {
  const colors = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm font-medium mt-1 opacity-80">{label}</p>
    </div>
  )
}

function ScoreBadge({ score }) {
  const cls = score >= 80 ? 'bg-green-100 text-green-700'
            : score >= 60 ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{score}/100</span>
}

export default function Dashboard() {
  const { user }                  = useAuth()
  const [reviews, setReviews]     = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    reviewsApi.list()
      .then(res => setReviews(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const total    = reviews.length
  const avgScore = total ? Math.round(reviews.reduce((s, r) => s + r.overall_score, 0) / total) : 0
  const posted   = reviews.filter(r => r.posted_to_github).length
  const recent   = reviews.slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name} 👋</h1>
        <p className="text-gray-500 mt-1">Here's your code review overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Reviews"      value={total}    icon="📋" color="blue"   />
        <StatCard label="Average Score"      value={avgScore} icon="📊" color="green"  />
        <StatCard label="Posted to GitHub"   value={posted}   icon="🐙" color="purple" />
        <StatCard label="This Month"
          value={reviews.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth()).length}
          icon="📅" color="orange"
        />
      </div>

      {/* Quick action */}
      <Link
        to="/reviews/new"
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors mb-8"
      >
        🔍 Analyze a Pull Request
      </Link>

      {/* Recent Reviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Reviews</h2>
          <Link to="/reviews" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium text-gray-600">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-1">Analyze your first pull request to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map(review => (
              <Link
                key={review.id}
                to={`/reviews/${review.id}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {review.pull_request?.repository?.name ?? 'Repository'} #{review.pull_request?.pr_number}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{review.pull_request?.title ?? '—'}</p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  {review.posted_to_github && <span className="text-xs text-green-600 font-medium">✅ GitHub</span>}
                  <ScoreBadge score={review.overall_score} />
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
