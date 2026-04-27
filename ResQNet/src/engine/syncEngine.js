import { syncOfflineRequests } from '../lib/api';
import { getQueue, saveQueue } from './resilienceEngine';

export async function syncPendingRequests() {
  const queue = getQueue();

  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  try {
    const result = await syncOfflineRequests(queue);
    saveQueue([]);
    return { synced: result.length, failed: 0 };
  } catch {
    return { synced: 0, failed: queue.length };
  }
}

export function startSyncEngine(onSyncComplete) {
  const intervalId = setInterval(async () => {
    if (!navigator.onLine) return;

    const simulated = localStorage.getItem('resqnet_simulated_network');
    if (simulated === 'offline') return;

    const result = await syncPendingRequests();
    if (result.synced > 0) {
      onSyncComplete(result);
    }
  }, 10000);

  return () => clearInterval(intervalId);
}
