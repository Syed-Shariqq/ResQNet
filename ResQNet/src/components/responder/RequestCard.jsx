import Card from '../shared/Card';
import ChannelIndicator from '../shared/ChannelIndicator';
import RequestTracker from '../shared/RequestTracker';
import StatusBadge from '../shared/StatusBadge';
import { getSeverityTone, normalizeToken } from '../shared/statusUtils';

function formatTimestamp(value) {
  if (!value) return 'Time unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export default function RequestCard({
  request,
  onAssign,
  onResolve,
  busyAction,
  onSelect,
  isSelected = false,
}) {
  const severity = getSeverityTone(request.severity);
  const status = normalizeToken(request.status, 'pending');
  const canAssign = status === 'pending';
  const canResolve = status === 'assigned';
  const isBusy = Boolean(busyAction);

  const handleAssign = (event) => {
    event.stopPropagation();
    onAssign(request);
  };

  const handleResolve = (event) => {
    event.stopPropagation();
    onResolve(request);
  };

  return (
    <Card
      accent={severity}
      className={`request-card request-card--${severity} ${isSelected ? 'request-card--selected' : ''}`}
      interactive
      onClick={() => onSelect?.(request)}
    >
      <div className="request-card__header">
        <div className="request-card__badges">
          <StatusBadge type="severity" value={request.severity} />
          <StatusBadge value={request.status} />
        </div>
        <ChannelIndicator channel={request.channelUsed} compact />
      </div>

      <div className="request-card__body">
        <p className="request-card__description">
          {request.description || 'No description supplied.'}
        </p>
        <div className="request-card__meta">
          <span>{request.location || 'Unknown location'}</span>
          <span>{formatTimestamp(request.createdAt)}</span>
        </div>
      </div>

      <RequestTracker
        compact
        requestId={request.id}
        status={request.status}
        channel={request.channelUsed}
      />

      <div className="request-card__footer">
        <span className="request-card__category">
          {request.category || 'unclassified'}
        </span>
        <div className="request-card__actions">
          {canAssign && (
            <button
              className="button button--primary"
              disabled={isBusy}
              onClick={handleAssign}
              type="button"
            >
              {busyAction === 'assign' ? 'Accepting' : 'Accept'}
            </button>
          )}
          {canResolve && (
            <button
              className="button button--success"
              disabled={isBusy}
              onClick={handleResolve}
              type="button"
            >
              {busyAction === 'resolve' ? 'Resolving' : 'Resolve'}
            </button>
          )}
          {status === 'resolved' && (
            <span className="request-card__closed">Closed</span>
          )}
        </div>
      </div>
    </Card>
  );
}
