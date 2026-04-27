const severityConfig = {
  critical: {
    classes: 'bg-red-600 text-white',
    label: '⚠ CRITICAL',
  },
  high: {
    classes: 'bg-orange-500 text-white',
    label: '▲ HIGH',
  },
  medium: {
    classes: 'bg-yellow-500 text-black',
    label: '● MEDIUM',
  },
  low: {
    classes: 'bg-green-600 text-white',
    label: '✓ LOW',
  },
};

export default function SeverityBadge({ severity }) {
  const config = severityConfig[severity?.toLowerCase()] ?? {
    classes: 'bg-gray-600 text-white',
    label: '? UNKNOWN',
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
