import { createRequest } from '../lib/api';
import { NetworkState } from './networkDetector';

// --- LocalStorage queue helpers ---

export function getQueue() {
  return JSON.parse(localStorage.getItem('resqnet_pending_queue') || '[]');
}

export function pushToQueue(item) {
  const queue = getQueue();
  queue.push({ ...item, queuedAt: new Date().toISOString() });
  saveQueue(queue);
}

export function saveQueue(arr) {
  localStorage.setItem('resqnet_pending_queue', JSON.stringify(arr));
}

export function clearQueue() {
  localStorage.removeItem('resqnet_pending_queue');
}

// --- Smart submission based on network state ---

export async function submitRequest(formData, triageResult, networkState) {
  const basePayload = {
    description: formData.description,
    location: formData.location,
    severity: triageResult.severity,
    category: triageResult.category,
    smsPayload: triageResult.sms_payload,
    status: 'pending',
  };

  if (networkState === NetworkState.ONLINE) {
    const payload = { ...basePayload, channelUsed: 'internet' };
    const result = await createRequest(payload);
    return { success: true, channel: 'internet', synced: true, data: result };
  }

  if (networkState === NetworkState.DEGRADED) {
    const minPayload = {
      description: triageResult.sms_payload,
      location: formData.location,
      severity: triageResult.severity,
      category: triageResult.category,
      smsPayload: triageResult.sms_payload,
      status: 'pending',
      channelUsed: 'sms_compressed',
    };
    try {
      const result = await createRequest(minPayload);
      return { success: true, channel: 'sms_compressed', synced: true, data: result };
    } catch {
      pushToQueue({ ...basePayload, channelUsed: 'relay_queued' });
      return { success: true, channel: 'relay_queued', synced: false, data: null };
    }
  }

  // OFFLINE
  pushToQueue({ ...basePayload, channelUsed: 'relay_queued' });
  return { success: true, channel: 'relay_queued', synced: false, data: null };
}
