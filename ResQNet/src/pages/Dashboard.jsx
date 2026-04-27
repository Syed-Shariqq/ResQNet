import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QuickRequestPanel from '../components/citizen/QuickRequestPanel';
import RequestCard from '../components/responder/RequestCard';
import SystemStatusPanel from '../components/responder/SystemStatusPanel';
import Card from '../components/shared/Card';
import { ChannelStatusBar } from '../components/shared/ChannelIndicator';
import MapView from '../components/shared/MapView';
import { getSeverityTone, normalizeToken } from '../components/shared/statusUtils';
import { hasValidCoordinates } from '../lib/locationService';
import { assignRequest, getRequests, resolveRequest } from '../lib/api';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'pending', label: 'Pending' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'resolved', label: 'Resolved' },
];

const severityOrder = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const COORDINATE_CACHE_KEY = 'resqnet_request_coordinates';

function readResponderName() {
  return localStorage.getItem('resqnet_responder_name') || 'Command Desk';
}

function countStatus(requests, status) {
  return requests.filter((request) => normalizeToken(request.status) === status).length;
}

function readCoordinateCache() {
  try {
    return JSON.parse(localStorage.getItem(COORDINATE_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeCoordinateCache(request) {
  if (!request?.id || !hasValidCoordinates(request)) return;

  const current = readCoordinateCache();
  localStorage.setItem(COORDINATE_CACHE_KEY, JSON.stringify({
    ...current,
    [request.id]: {
      latitude: Number(request.latitude ?? request.lat),
      longitude: Number(request.longitude ?? request.lng ?? request.lon),
      location: request.location,
    },
  }));
}

function applyCoordinateCache(requests) {
  const cache = readCoordinateCache();

  return requests.map((request) => {
    if (hasValidCoordinates(request)) return request;

    const cached = cache[request.id];
    if (!cached) return request;

    return {
      ...request,
      location: request.location || cached.location,
      latitude: cached.latitude,
      longitude: cached.longitude,
    };
  });
}

function orderRequests(requests) {
  return [...requests].sort((first, second) => {
    const firstSeverity = severityOrder[getSeverityTone(first.severity)] ?? 9;
    const secondSeverity = severityOrder[getSeverityTone(second.severity)] ?? 9;
    if (firstSeverity !== secondSeverity) return firstSeverity - secondSeverity;

    return new Date(first.createdAt || 0).getTime() - new Date(second.createdAt || 0).getTime();
  });
}

function requestMatchesFilter(request, filter) {
  if (filter === 'all') return true;
  if (filter === 'critical') return getSeverityTone(request.severity) === 'critical';

  return normalizeToken(request.status) === filter;
}

function formatLastRefresh(date) {
  if (!date) return 'Waiting for sync';

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function StatCard({ label, value, tone }) {
  return (
    <Card className={`stat-card stat-card--${tone || 'neutral'}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </Card>
  );
}

function SkeletonList() {
  return (
    <div className="request-list">
      {[0, 1, 2].map((item) => (
        <Card className="request-card skeleton-card" key={item}>
          <div className="skeleton-row skeleton-row--short" />
          <div className="skeleton-row skeleton-row--wide" />
          <div className="skeleton-row" />
          <div className="skeleton-row skeleton-row--half" />
        </Card>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [busyRequest, setBusyRequest] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [responderName, setResponderName] = useState(readResponderName);
  const [draftLocation, setDraftLocation] = useState(null);
  const cardRefs = useRef(new Map());

  const loadRequests = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const data = await getRequests();
      setRequests(Array.isArray(data) ? applyCoordinateCache(data) : []);
      setLastRefreshed(new Date());
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const firstLoadId = window.setTimeout(() => loadRequests(), 0);
    const intervalId = window.setInterval(() => loadRequests({ silent: true }), 8000);

    return () => {
      window.clearTimeout(firstLoadId);
      window.clearInterval(intervalId);
    };
  }, [loadRequests]);

  useEffect(() => {
    localStorage.setItem('resqnet_responder_name', responderName || 'Command Desk');
  }, [responderName]);

  const stats = useMemo(() => {
    const pending = countStatus(requests, 'pending');
    const assigned = countStatus(requests, 'assigned');
    const resolved = countStatus(requests, 'resolved');
    const critical = requests.filter((request) => getSeverityTone(request.severity) === 'critical').length;

    return [
      { label: 'Total Pending', value: pending, tone: pending > 0 ? 'pending' : 'neutral' },
      { label: 'Assigned', value: assigned, tone: 'assigned' },
      { label: 'Resolved', value: resolved, tone: 'resolved' },
      { label: 'Critical', value: critical, tone: critical > 0 ? 'critical' : 'neutral' },
    ];
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => requestMatchesFilter(request, filter));
  }, [filter, requests]);

  const focusRequest = useMemo(() => {
    const selected = requests.find((request) => request.id === selectedRequestId);
    if (selected) return selected;

    return requests.find((request) => getSeverityTone(request.severity) === 'critical')
      || requests.find((request) => normalizeToken(request.status) !== 'resolved')
      || requests[0];
  }, [requests, selectedRequestId]);

  const handleSelectRequest = useCallback((request, options = {}) => {
    if (!request?.id) return;

    setSelectedRequestId(request.id);

    if (options.scroll) {
      setFilter((current) => requestMatchesFilter(request, current) ? current : 'all');
      window.setTimeout(() => {
        cardRefs.current.get(request.id)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 140);
    }
  }, []);

  const handleCreatedRequest = useCallback((created) => {
    writeCoordinateCache(created);
    setRequests((current) => orderRequests([
      created,
      ...current.filter((request) => request.id !== created.id),
    ]));
    setFilter('all');
    setSelectedRequestId(created.id);
    setDraftLocation(null);
    window.setTimeout(() => {
      cardRefs.current.get(created.id)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 140);
  }, []);

  const handleAssign = async (request) => {
    if (!request?.id) return;

    setBusyRequest({ id: request.id, action: 'assign' });
    try {
      const updated = await assignRequest(request.id, responderName || 'Command Desk');
      setRequests((current) => current.map((item) => (
        item.id === request.id
          ? {
              ...item,
              ...updated,
              latitude: updated.latitude ?? item.latitude,
              longitude: updated.longitude ?? item.longitude,
            }
          : item
      )));
      setSelectedRequestId(request.id);
    } catch (assignError) {
      setError(assignError.message);
    } finally {
      setBusyRequest(null);
    }
  };

  const handleResolve = async (request) => {
    if (!request?.id) return;

    setBusyRequest({ id: request.id, action: 'resolve' });
    try {
      const updated = await resolveRequest(request.id);
      setRequests((current) => current.map((item) => (
        item.id === request.id
          ? {
              ...item,
              ...updated,
              latitude: updated.latitude ?? item.latitude,
              longitude: updated.longitude ?? item.longitude,
            }
          : item
      )));
      setSelectedRequestId(request.id);
    } catch (resolveError) {
      setError(resolveError.message);
    } finally {
      setBusyRequest(null);
    }
  };

  return (
    <main className="command-page">
      <div className="command-container">
        <header className="command-header">
          <div className="command-header__copy">
            <p className="eyebrow">ResQNet Command Center</p>
            <h1>Disaster Coordination</h1>
            <p>
              Live request intake, responder assignment, and channel resilience in one operational view.
            </p>
          </div>

          <div className="command-header__status">
            <ChannelStatusBar />
            <div className="refresh-row">
              <span>Last sync: {formatLastRefresh(lastRefreshed)}</span>
              <button
                className="button button--secondary"
                disabled={loading}
                onClick={() => loadRequests()}
                type="button"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        <section className="stats-grid" aria-label="Request statistics">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="dashboard-grid">
          <div className="request-feed">
            <QuickRequestPanel
              onCreated={handleCreatedRequest}
              onError={setError}
              onLocationPreview={setDraftLocation}
            />

            <div className="section-title request-feed__header">
              <div>
                <p className="eyebrow">Live Requests</p>
                <h2>Priority Feed</h2>
              </div>
              <span className="feed-count">{filteredRequests.length} shown</span>
            </div>

            <div className="filter-tabs" role="tablist" aria-label="Request filters">
              {FILTERS.map((item) => (
                <button
                  aria-selected={filter === item.id}
                  className={`filter-tab ${filter === item.id ? 'filter-tab--active' : ''}`}
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  role="tab"
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="alert" role="alert">
                {error}
              </div>
            )}

            {loading ? (
              <SkeletonList />
            ) : filteredRequests.length > 0 ? (
              <div className="request-list">
                {filteredRequests.map((request) => (
                  <div
                    className="request-card-anchor"
                    key={request.id}
                    ref={(node) => {
                      if (node) cardRefs.current.set(request.id, node);
                      else cardRefs.current.delete(request.id);
                    }}
                  >
                    <RequestCard
                      busyAction={busyRequest?.id === request.id ? busyRequest.action : null}
                      isSelected={focusRequest?.id === request.id}
                      onAssign={handleAssign}
                      onResolve={handleResolve}
                      onSelect={handleSelectRequest}
                      request={request}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="empty-state">
                <h3>No matching requests</h3>
                <p>The command feed is clear for this filter.</p>
              </Card>
            )}
          </div>

          <div className="dashboard-side">
            <MapView
              draftLocation={draftLocation}
              onSelectRequest={(request) => handleSelectRequest(request, { scroll: true })}
              requests={requests}
              selectedRequestId={focusRequest?.id}
            />

            <SystemStatusPanel
              focusRequest={focusRequest}
              onResponderNameChange={setResponderName}
              requests={requests}
              responderName={responderName}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
