import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { reviewsApi } from '../api/reviews'
import GithubPostStatus from '../components/GithubPostStatus'
import SeverityBadge    from '../components/SeverityBadge'

// ── helpers ────────────────────────────────────────────────────────────────

const CATEGORIES = ['all', 'security', 'performance', 'quality', 'architecture']
const SEVERITIES = ['all', 'critical', 'high', 'medium', 'low', 'info']

const CAT_META = {
  security:     { icon: '🔒', label: 'Security',     color: 'text-red-600 bg-red-50 border-red-200'         },
  performance:  { icon: '⚡', label: 'Performance',   color: 'text-orange-600 bg-orange-50 border-orange-200' },
  quality:      { icon: '📐', label: 'Code Quality',  color: 'text-blue-600 bg-blue-50 border-blue-200'       },
  architecture: { icon: '🏗️', label: 'Architecture', color: 'text-purple-600 bg-purple-50 border-purple-200'  },
}

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

function scoreColor(score) {
  if (score >= 80) return { ring: 'stroke-green-500',  text: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  label: 'Good'  }
  if (score >= 60) return { ring: 'stroke-yellow-400', text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Fair'  }
  return            { ring: 'stroke-red-500',   text: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   label: 'Poor'  }
}

// Circular progress score widget
function ScoreRing({ label, score, icon, size = 'sm' }) {
  const r   = size === 'lg' ? 44 : 30
  const cx  = size === 'lg' ? 56 : 38
  const sw  = size === 'lg' ? 7  : 5
  const circ = 2 * Math.PI * r
  const dash  = (score / 100) * circ
  const c     = scoreColor(score)

  return (
    <div className={`flex flex-col items-center gap-1 ${size === 'lg' ? '' : ''}`}>
      <div className="relative inline-flex items-center justify-center">
        <svg width={cx * 2} height={cx * 2} className="-rotate-90">
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
          <circle
            cx={cx} cy={cx} r={r} fill="none"
            className={c.ring}
            strokeWidth={sw}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          {size === 'lg' && <span className="text-lg leading-none">{icon}</span>}
          <span className={`font-bold leading-none ${size === 'lg' ? 'text-2xl' : 'text-sm'} ${c.text}`}>
            {score}
          </span>
        </div>
      </div>
      <p className={`text-xs font-medium text-gray-500 text-center leading-tight ${size === 'lg' ? 'text-sm' : ''}`}>
        {size !== 'lg' && <span className="mr-1">{icon}</span>}{label}
      </p>
      {size === 'lg' && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.border} ${c.text}`}>
          {c.label}
        </span>
      )}
    </div>
  )
}

// Single finding card
function FindingCard({ finding, index }) {
  const [open, setOpen] = useState(index < 3) // first 3 open by default
  const meta = CAT_META[finding.category] ?? CAT_META.quality

  return (
    <div className={`border rounded-xl overflow-hidden transition-shadow hover:shadow-md ${open ? 'shadow-sm' : ''}`}>
      {/* Card header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 p-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        {/* Severity stripe */}
        <div className="shrink-0 mt-0.5">
          <SeverityBadge severity={finding.severity} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
              {meta.icon} {meta.label}
            </span>
            {finding.file_path && (
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded truncate max-w-xs">
                {finding.file_path}{finding.line_number ? `:${finding.line_number}` : ''}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800 leading-snug">{finding.issue}</p>
        </div>

        <span className={`shrink-0 text-gray-400 text-sm mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Expandable recommendation */}
      {open && (
        <div className="px-4 pb-4 bg-white border-t border-gray-100">
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <p className="text-xs font-bold text-emerald-700 mb-1 flex items-center gap-1">
              💡 Recommendation
            </p>
            <p className="text-sm text-emerald-900 leading-relaxed">{finding.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ReviewDetail() {
  const { id } = useParams()
  const [review, setReview]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [catFilter, setCatFilter] = useState('all')
  const [sevFilter, setSevFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('findings') // findings | raw

  const fetchReview = useCallback(() => {
    setLoading(true)
    reviewsApi.get(id)
      .then(res => setReview(res.data.data))
      .catch(() => setError('Failed to load review.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { fetchReview() }, [fetchReview])

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="text-center">
        <svg className="animate-spin w-10 h-10 text-blue-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-gray-400 text-sm">Loading review...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-red-600 font-medium">{error}</p>
        <Link to="/reviews" className="mt-3 inline-block text-sm text-blue-600 hover:underline">← Back to History</Link>
      </div>
    </div>
  )

  if (!review) return null

  const pr      = review.pull_request
  const repo    = pr?.repository
  const findings = review.findings ?? []

  const filteredFindings = findings
    .filter(f => catFilter === 'all' || f.category === catFilter)
    .filter(f => sevFilter === 'all' || f.severity === sevFilter)
    .sort((a, b) => (SEV_ORDER[a.severity] ?? 5) - (SEV_ORDER[b.severity] ?? 5))

  const countBy = (key, val) => findings.filter(f => f[key] === val).length

  const prGithubUrl = repo?.url
    ? `${repo.url}/pull/${pr.pr_number}`
    : null

  const modelLabel = review.ai_model
    ? `${review.ai_provider === 'claude' ? '🟣' : '🟢'} ${review.ai_model}`
    : null

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/reviews" className="text-gray-400 hover:text-gray-700 transition-colors shrink-0">
              ← Back
            </Link>
            <span className="text-gray-300">|</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {repo?.owner}/{repo?.name}
                <span className="text-gray-400 font-normal ml-1">#{pr?.pr_number}</span>
              </p>
              <p className="text-xs text-gray-500 truncate hidden sm:block">{pr?.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {modelLabel && (
              <span className="hidden md:inline text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {modelLabel}
              </span>
            )}
            {prGithubUrl && (
              <a
                href={prGithubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                🐙 View PR
              </a>
            )}
            <GithubPostStatus review={review} onPosted={fetchReview} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── Hero score row ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-center gap-8">

            {/* Overall score — large ring */}
            <div className="shrink-0">
              <ScoreRing label="Overall Score" score={review.overall_score} icon="🏆" size="lg" />
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-28 bg-gray-200" />

            {/* Category scores */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 flex-1">
              <ScoreRing label="Security"     score={review.security_score}     icon="🔒" />
              <ScoreRing label="Performance"  score={review.performance_score}  icon="⚡" />
              <ScoreRing label="Code Quality" score={review.quality_score}      icon="📐" />
              <ScoreRing label="Architecture" score={review.architecture_score} icon="🏗️" />
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-28 bg-gray-200" />

            {/* Severity counts */}
            <div className="shrink-0 grid grid-cols-2 gap-3">
              {[
                { label: 'Critical', sev: 'critical', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    emoji: '🚨' },
                { label: 'High',     sev: 'high',     bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', emoji: '⚠️' },
                { label: 'Medium',   sev: 'medium',   bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', emoji: '🔶' },
                { label: 'Low',      sev: 'low',      bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   emoji: '🔵' },
              ].map(({ label, sev, bg, border, text, emoji }) => (
                <button
                  key={sev}
                  onClick={() => setSevFilter(sevFilter === sev ? 'all' : sev)}
                  className={`flex flex-col items-center py-3 px-5 rounded-xl border-2 cursor-pointer transition-all ${
                    sevFilter === sev
                      ? `${bg} ${border} ring-2 ring-offset-1 ring-current ${text}`
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{emoji}</span>
                  <span className={`text-xl font-bold ${sevFilter === sev ? text : 'text-gray-700'}`}>
                    {countBy('severity', sev)}
                  </span>
                  <span className="text-xs font-medium text-gray-500">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          {review.ai_raw_response?.summary && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">🤖 AI Summary</p>
              <p className="text-sm text-gray-700 leading-relaxed">{review.ai_raw_response.summary}</p>
            </div>
          )}
        </div>

        {/* ── Meta row ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            pr?.author      && { icon: '👤', text: pr.author },
            pr?.state       && { icon: '🔵', text: pr.state.charAt(0).toUpperCase() + pr.state.slice(1) },
            review.ai_model && { icon: review.ai_provider === 'claude' ? '🟣' : '🟢', text: review.ai_model },
            review.created_at && { icon: '🕐', text: new Date(review.created_at).toLocaleString() },
          ].filter(Boolean).map((badge, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full shadow-sm">
              <span>{badge.icon}</span>
              <span>{badge.text}</span>
            </span>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
          {[
            { key: 'findings', label: `Findings (${findings.length})` },
            { key: 'raw',      label: 'Raw AI Response'               },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Findings tab ─────────────────────────────────────────────────── */}
        {activeTab === 'findings' && (
          <div className="flex gap-6">

            {/* Sidebar filters */}
            <aside className="hidden lg:block w-52 shrink-0">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm sticky top-20">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Category</p>
                <div className="space-y-1 mb-5">
                  {CATEGORIES.map(c => {
                    const meta  = CAT_META[c]
                    const count = c === 'all' ? findings.length : countBy('category', c)
                    return (
                      <button
                        key={c}
                        onClick={() => setCatFilter(c)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          catFilter === c
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{meta ? `${meta.icon} ${meta.label}` : '📋 All'}</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                          catFilter === c ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>{count}</span>
                      </button>
                    )
                  })}
                </div>

                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Severity</p>
                <div className="space-y-1">
                  {SEVERITIES.map(s => {
                    const count = s === 'all' ? findings.length : countBy('severity', s)
                    return (
                      <button
                        key={s}
                        onClick={() => setSevFilter(s)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          sevFilter === s
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="capitalize">{s === 'all' ? '📋 All' : s}</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                          sevFilter === s ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>{count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>

            {/* Mobile filter pills */}
            <div className="lg:hidden flex flex-wrap gap-2 mb-4 w-full">
              {CATEGORIES.filter(c => c !== 'all').map(c => (
                <button
                  key={c}
                  onClick={() => setCatFilter(catFilter === c ? 'all' : c)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    catFilter === c
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  {CAT_META[c].icon} {CAT_META[c].label}
                </button>
              ))}
            </div>

            {/* Findings list */}
            <div className="flex-1 min-w-0">
              {/* Active filters indicator */}
              {(catFilter !== 'all' || sevFilter !== 'all') && (
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                  <span>Showing {filteredFindings.length} of {findings.length} findings</span>
                  <button
                    onClick={() => { setCatFilter('all'); setSevFilter('all') }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {filteredFindings.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
                  <p className="text-5xl mb-3">✅</p>
                  <p className="font-semibold text-gray-700">No findings match your filters</p>
                  <button
                    onClick={() => { setCatFilter('all'); setSevFilter('all') }}
                    className="mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFindings.map((f, i) => (
                    <FindingCard key={f.id ?? i} finding={f} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Raw AI Response tab ──────────────────────────────────────────── */}
        {activeTab === 'raw' && (
          <div className="bg-gray-900 rounded-2xl border border-gray-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
              <p className="text-xs font-mono text-gray-400">ai_raw_response.json</p>
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(review.ai_raw_response, null, 2))}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="p-5 text-xs text-green-300 font-mono overflow-auto max-h-[600px] leading-relaxed">
              {JSON.stringify(review.ai_raw_response, null, 2)}
            </pre>
          </div>
        )}

      </div>
    </div>
  )
}
