const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function request(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('Network unavailable. Command center cannot reach the API.');
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = payload?.error || payload || `API request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export function getRequests(options) {
  return request('/api/requests', options);
}

export function createRequest(data) {
  return request('/api/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function assignRequest(id, responderName) {
  const params = new URLSearchParams({ responderName });

  return request(`/api/requests/${id}/assign?${params.toString()}`, {
    method: 'PUT',
  });
}

export function resolveRequest(id) {
  return request(`/api/requests/${id}/resolve`, {
    method: 'PUT',
  });
}

export function syncOfflineRequests(requestsArray) {
  return request('/api/requests/sync', {
    method: 'POST',
    body: JSON.stringify(requestsArray),
  });
}

export const getAllRequests = getRequests;
