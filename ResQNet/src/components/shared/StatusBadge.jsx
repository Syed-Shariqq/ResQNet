import { normalizeToken } from './statusUtils';

const severityConfig = {
  critical: { label: 'Critical', className: 'status-badge--critical' },
  high: { label: 'High', className: 'status-badge--high' },
  medium: { label: 'Medium', className: 'status-badge--medium' },
  low: { label: 'Low', className: 'status-badge--low' },
};

const requestStatusConfig = {
  pending: { label: 'Pending', className: 'status-badge--pending' },
  assigned: { label: 'Assigned', className: 'status-badge--assigned' },
  resolved: { label: 'Resolved', className: 'status-badge--resolved' },
};

export default function StatusBadge({ type = 'status', value }) {
  const normalized = normalizeToken(value);
  const config = type === 'severity'
    ? severityConfig[normalized]
    : requestStatusConfig[normalized];

  const fallback = {
    label: value || 'Unknown',
    className: 'status-badge--neutral',
  };

  const { label, className } = config || fallback;

  return (
    <span className={`status-badge ${className}`}>
      {label}
    </span>
  );
}
