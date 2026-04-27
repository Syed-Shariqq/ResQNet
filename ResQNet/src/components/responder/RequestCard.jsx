const channelIcon = {
  internet:       '🌐',
  sms_compressed: '📡',
  relay_queued:   '💾',
}

function timeAgo(createdAt) {
  const diff = Date.now() - new Date(createdAt).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60)  return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60)  return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default function RequestCard({ request, onAssign, onResolve }) {
  const isCritical = request.severity === 'critical'

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3 transition-all"
      style={{
        background: 'var(--color-bg-card)',
        border: isCritical
          ? '2px solid var(--color-red-primary)'
          : '1px solid var(--color-border)',
        boxShadow: isCritical ? '0 0 20px rgba(220,38,38,0.15)' : 'none',
      }}
    >
      {/* TOP ROW */}
      <div className="flex justify-between items-start">
        <SeverityBadge severity={request.severity} />
        <div className="flex items-center">
          <span className="text-sm">{channelIcon[request.channelUsed] ?? '📡'}</span>
          <span
            className="ml-2 text-xs px-2 py-0.5 rounded"
            style={{
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {request.category || 'unknown'}
          </span>
        </div>
      </div>

      {/* DESCRIPTION */}
      <p
        className="text-sm leading-relaxed"
        style={{
          color: 'var(--color-text-primary)',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {request.description}
      </p>

      {/* LOCATION */}
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        📍 {request.location}
      </p>

      {/* FOOTER */}
      <div className="flex justify-between items-center mt-2">
        <span
          className="text-xs"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          {request.createdAt ? timeAgo(request.createdAt) : '—'}
        </span>

        {/* Actions by status */}
        {request.status === 'pending' && (
          <button
            onClick={() => onAssign(request.id)}
            className="text-xs px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-80"
            style={{ background: 'var(--color-blue)' }}
          >
            Accept
          </button>
        )}

        {request.status === 'assigned' && (
          <div className="flex gap-2 items-center">
            <span
              className="text-xs"
              style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              👤 {request.assignedTo}
            </span>
            <button
              onClick={() => onResolve(request.id)}
              className="text-xs px-3 py-2 rounded-lg text-white transition-opacity hover:opacity-80"
              style={{ background: 'var(--color-green)' }}
            >
              Resolve
            </button>
          </div>
        )}

        {request.status === 'resolved' && (
          <span
            className="text-xs"
            style={{ color: 'var(--color-green)', fontFamily: 'var(--font-mono)' }}
          >
            ✅ Resolved
          </span>
        )}
      </div>
    </div>
  )
}

// Inlined here to avoid a circular import — SeverityBadge is tiny
function SeverityBadge({ severity }) {
  const cfg = {
    critical: { cls: 'bg-red-600 text-white',    label: '⚠ CRITICAL' },
    high:     { cls: 'bg-orange-500 text-white',  label: '▲ HIGH' },
    medium:   { cls: 'bg-yellow-500 text-black',  label: '● MEDIUM' },
    low:      { cls: 'bg-green-600 text-white',   label: '✓ LOW' },
  }[severity?.toLowerCase()] ?? { cls: 'bg-gray-600 text-white', label: '? UNKNOWN' }

  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
