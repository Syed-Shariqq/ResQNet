import { NetworkState } from '../../engine/networkDetector';

const configs = {
  [NetworkState.ONLINE]: {
    label: 'Online',
    className: 'network-badge--online',
  },
  [NetworkState.DEGRADED]: {
    label: 'Degraded / SMS',
    className: 'network-badge--degraded',
  },
  [NetworkState.OFFLINE]: {
    label: 'Offline / Relay',
    className: 'network-badge--offline',
  },
};

export default function NetworkBadge({ networkState }) {
  const config = configs[networkState] ?? configs[NetworkState.ONLINE];

  return (
    <span className={`network-badge ${config.className}`}>
      <span className="network-badge__dot" />
      {config.label}
    </span>
  );
}
