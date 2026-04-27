import StatusBadge from './StatusBadge';

export default function SeverityBadge({ severity }) {
  return <StatusBadge type="severity" value={severity} />;
}
