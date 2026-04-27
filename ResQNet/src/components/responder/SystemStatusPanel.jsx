import Card from '../shared/Card';
import ChannelIndicator from '../shared/ChannelIndicator';
import RequestTracker from '../shared/RequestTracker';
import StatusBadge from '../shared/StatusBadge';
import { getSeverityTone, normalizeToken } from '../shared/statusUtils';

function countBy(requests, field, value) {
  return requests.filter((request) => normalizeToken(request[field]) === value).length;
}

function StatLine({ label, value, tone = 'neutral' }) {
  return (
    <div className="system-line">
      <span>{label}</span>
      <strong className={`system-line__value system-line__value--${tone}`}>{value}</strong>
    </div>
  );
}

export default function SystemStatusPanel({
  requests = [],
  responderName,
  onResponderNameChange,
  focusRequest,
}) {
  const activeRequests = requests.filter((request) => normalizeToken(request.status) !== 'resolved');
  const critical = requests.filter((request) => getSeverityTone(request.severity) === 'critical').length;
  const relay = countBy(requests, 'channelUsed', 'relay_queued');
  const sms = countBy(requests, 'channelUsed', 'sms_compressed');
  const internet = countBy(requests, 'channelUsed', 'internet');

  return (
    <aside className="system-panel" aria-label="System panel">
      <Card className="system-card">
        <div className="section-title">
          <div>
            <p className="eyebrow">System</p>
            <h2>Operations Status</h2>
          </div>
          <span className="live-pill">
            <span />
            Live
          </span>
        </div>

        <div className="system-lines">
          <StatLine label="Active Incidents" value={activeRequests.length} />
          <StatLine label="Critical Queue" value={critical} tone={critical > 0 ? 'critical' : 'neutral'} />
          <StatLine label="Relay Backlog" value={relay} tone={relay > 0 ? 'high' : 'neutral'} />
        </div>

        <label className="operator-field">
          <span>Active responder</span>
          <input
            onChange={(event) => onResponderNameChange?.(event.target.value)}
            placeholder="Responder name"
            value={responderName}
          />
        </label>
      </Card>

      <Card className="system-card">
        <div className="section-title">
          <div>
            <p className="eyebrow">Channels</p>
            <h2>Intake Mix</h2>
          </div>
        </div>
        <div className="channel-mix">
          <ChannelIndicator channel="internet" status={String(internet)} />
          <ChannelIndicator channel="sms_compressed" status={String(sms)} />
          <ChannelIndicator channel="relay_queued" status={String(relay)} />
        </div>
      </Card>

      <Card className="system-card">
        <div className="section-title">
          <div>
            <p className="eyebrow">Lifecycle</p>
            <h2>Priority Track</h2>
          </div>
        </div>

        {focusRequest ? (
          <div className="focus-request">
            <div className="focus-request__meta">
              <StatusBadge type="severity" value={focusRequest.severity} />
              <StatusBadge value={focusRequest.status} />
            </div>
            <p>{focusRequest.description}</p>
            <RequestTracker
              requestId={focusRequest.id}
              status={focusRequest.status}
              channel={focusRequest.channelUsed}
            />
          </div>
        ) : (
          <p className="empty-copy">No requests are currently in the command queue.</p>
        )}
      </Card>
    </aside>
  );
}
