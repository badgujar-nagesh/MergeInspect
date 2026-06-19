const config = {
  critical: { emoji: '🚨', classes: 'bg-red-100 text-red-800 border-red-200'       },
  high:     { emoji: '⚠️',  classes: 'bg-orange-100 text-orange-800 border-orange-200' },
  medium:   { emoji: '🔶', classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  low:      { emoji: '🔵', classes: 'bg-blue-100 text-blue-800 border-blue-200'     },
  info:     { emoji: 'ℹ️',  classes: 'bg-gray-100 text-gray-700 border-gray-200'    },
}

export default function SeverityBadge({ severity }) {
  const { emoji, classes } = config[severity] ?? config.info
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes}`}>
      {emoji} {severity.toUpperCase()}
    </span>
  )
}
