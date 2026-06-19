import SeverityBadge from './SeverityBadge'

const categoryIcon = { security: '🔒', performance: '⚡', quality: '📐', architecture: '🏗️' }

export default function FindingsList({ findings }) {
  if (!findings?.length) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">✅</p>
        <p className="font-medium">No findings — great code!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {findings.map((f, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-sm transition-shadow">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <SeverityBadge severity={f.severity} />
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium capitalize">
              {categoryIcon[f.category] ?? '📋'} {f.category}
            </span>
            {f.file_path && (
              <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                📄 {f.file_path}{f.line_number ? `:${f.line_number}` : ''}
              </span>
            )}
          </div>

          <p className="font-semibold text-gray-800 mb-2">{f.issue}</p>

          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-700 mb-1">💡 Recommendation</p>
            <p className="text-sm text-green-800">{f.recommendation}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
