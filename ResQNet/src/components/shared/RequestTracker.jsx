import { useEffect, useMemo, useState } from 'react';

const STEPS = ['Created', 'Stored', 'Routing', 'Delivered', 'Assigned', 'Resolved'];

function normalize(value) {
  return String(value || '').toLowerCase();
}

function getTargetIndex(status, channel) {
  const normalizedStatus = normalize(status);
  const normalizedChannel = normalize(channel);

  if (normalizedStatus === 'resolved') return 5;
  if (normalizedStatus === 'assigned') return 4;
  if (normalizedChannel === 'relay_queued') return 1;
  if (normalizedChannel === 'sms_compressed') return 3;

  return 3;
}

export default function RequestTracker({
  status = 'pending',
  channel = 'internet',
  requestId,
  compact = false,
}) {
  const targetIndex = useMemo(
    () => getTargetIndex(status, channel),
    [status, channel],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timers = [window.setTimeout(() => setActiveIndex(0), 0)];
    for (let index = 1; index <= targetIndex; index += 1) {
      timers.push(window.setTimeout(() => setActiveIndex(index), index * 140));
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [targetIndex, requestId]);

  return (
    <div className={`request-tracker ${compact ? 'request-tracker--compact' : ''}`}>
      {!compact && <p className="request-tracker__title">Request Lifecycle</p>}
      <div className="request-tracker__steps">
        {STEPS.map((step, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;
          const isFuture = index > activeIndex;

          return (
            <div
              className={[
                'request-tracker__step',
                isDone ? 'is-done' : '',
                isActive ? 'is-active' : '',
                isFuture ? 'is-future' : '',
              ].filter(Boolean).join(' ')}
              key={step}
            >
              <span className="request-tracker__node" />
              <span className="request-tracker__label">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
