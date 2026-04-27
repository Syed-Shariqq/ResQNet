import { useEffect, useState } from 'react';

const channelLabels = {
  internet: 'Internet',
  sms_compressed: 'SMS',
  relay_queued: 'Relay',
  local: 'Local',
};

function readOnlineState() {
  if (typeof navigator === 'undefined') return true;

  const simulated = localStorage.getItem('resqnet_simulated_network');
  if (simulated === 'offline') return false;
  if (simulated === 'online' || simulated === 'degraded') return true;

  return navigator.onLine;
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(readOnlineState);

  useEffect(() => {
    const update = () => setIsOnline(readOnlineState());

    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    const intervalId = window.setInterval(update, 3000);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      window.clearInterval(intervalId);
    };
  }, []);

  return isOnline;
}

export default function ChannelIndicator({ channel = 'internet', status, compact = false }) {
  const normalized = String(channel || 'internet').toLowerCase();
  const label = channelLabels[normalized] || normalized.replace(/_/g, ' ');
  const tone = normalized.includes('relay')
    ? 'relay'
    : normalized.includes('sms')
      ? 'sms'
      : 'internet';

  return (
    <span className={`channel-indicator channel-indicator--${tone} ${compact ? 'channel-indicator--compact' : ''}`}>
      <span className="channel-indicator__dot" />
      <span>{label}</span>
      {status && <span className="channel-indicator__status">{status}</span>}
    </span>
  );
}

export function ChannelStatusBar() {
  const isOnline = useOnlineStatus();
  const channels = [
    {
      id: 'internet',
      label: 'Internet',
      state: isOnline ? 'Online' : 'Offline',
      tone: isOnline ? 'online' : 'offline',
    },
    {
      id: 'sms',
      label: 'SMS',
      state: isOnline ? 'Standby' : 'Fallback',
      tone: isOnline ? 'standby' : 'fallback',
    },
    {
      id: 'relay',
      label: 'Relay',
      state: isOnline ? 'Standby' : 'Active',
      tone: isOnline ? 'standby' : 'active',
    },
  ];

  return (
    <div className="channel-status-bar" aria-label="Channel status">
      {channels.map((channel) => (
        <div
          className={`channel-status channel-status--${channel.tone}`}
          key={channel.id}
        >
          <span className="channel-status__dot" />
          <span className="channel-status__label">{channel.label}</span>
          <span className="channel-status__state">{channel.state}</span>
        </div>
      ))}
    </div>
  );
}
