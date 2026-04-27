import { NetworkState } from '../../engine/networkDetector';

const configs = {
  [NetworkState.ONLINE]: {
    wrapper: 'bg-green-950/50 text-green-400 border-green-800',
    dot: 'bg-green-500',
    label: '● ONLINE',
    pulse: false,
  },
  [NetworkState.DEGRADED]: {
    wrapper: 'bg-amber-950/50 text-amber-400 border-amber-800',
    dot: 'bg-amber-500',
    label: '● DEGRADED — SMS MODE',
    pulse: true,
  },
  [NetworkState.OFFLINE]: {
    wrapper: 'bg-red-950/50 text-red-400 border-red-800',
    dot: 'bg-red-500',
    label: '● OFFLINE — LOCAL QUEUE',
    pulse: true,
  },
};

export default function NetworkBadge({ networkState }) {
  const config = configs[networkState] ?? configs[NetworkState.ONLINE];

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono uppercase tracking-wider ${config.wrapper}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      {config.label}
    </span>
  );
}
