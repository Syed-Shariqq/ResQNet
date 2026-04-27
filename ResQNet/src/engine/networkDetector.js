import { useState, useEffect } from 'react';

export const NetworkState = {
  ONLINE: 'online',
  DEGRADED: 'degraded',
  OFFLINE: 'offline',
};

const TEST_URL = 'https://www.gstatic.com/generate_204';

export function useNetworkState() {
  const [networkState, setNetworkState] = useState(NetworkState.ONLINE);
  const [lastChecked, setLastChecked] = useState(null);

  const checkNetwork = async () => {
    // Demo panel override: allow simulated network state via localStorage
    const simulated = localStorage.getItem('resqnet_simulated_network');
    if (simulated) {
      setNetworkState(simulated);
      setLastChecked(new Date());
      return;
    }

    if (!navigator.onLine) {
      setNetworkState(NetworkState.OFFLINE);
      return;
    }

    try {
      await fetch(TEST_URL, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      });
      setNetworkState(NetworkState.ONLINE);
    } catch {
      setNetworkState(NetworkState.DEGRADED);
    }

    setLastChecked(new Date());
  };

  useEffect(() => {
    const initialCheckId = setTimeout(checkNetwork, 0);

    window.addEventListener('online', checkNetwork);
    window.addEventListener('offline', checkNetwork);
    const interval = setInterval(checkNetwork, 15000);

    return () => {
      clearTimeout(initialCheckId);
      window.removeEventListener('online', checkNetwork);
      window.removeEventListener('offline', checkNetwork);
      clearInterval(interval);
    };
  }, []);

  return {
    networkState,
    isOnline: networkState === NetworkState.ONLINE,
    isDegraded: networkState === NetworkState.DEGRADED,
    isOffline: networkState === NetworkState.OFFLINE,
    lastChecked,
  };
}
