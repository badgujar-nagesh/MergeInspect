export default function ScoreCard({ label, score, icon }) {
  const color =
    score >= 80 ? 'green' :
    score >= 60 ? 'yellow' : 'red'

  const colorClasses = {
    green:  { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  badge: 'bg-green-100 text-green-800'  },
    yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200',text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
    red:    { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    badge: 'bg-red-100 text-red-800'      },
  }[color]

  return (
    <div className={`rounded-xl p-5 border ${colorClasses.bg} ${colorClasses.border}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-600">{icon} {label}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClasses.badge}`}>
          {score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Poor'}
        </span>
      </div>
      <p className={`text-4xl font-bold ${colorClasses.text}`}>{score}<span className="text-lg font-normal text-gray-400">/100</span></p>
    </div>
  )
}
