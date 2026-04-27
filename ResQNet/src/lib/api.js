const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const COORDINATE_CACHE_KEY = 'resqnet_request_coordinates';

function hasPayloadCoordinates(data) {
  const latitude = Number(data?.latitude);
  const longitude = Number(data?.longitude);

  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90
    && Math.abs(longitude) <= 180;
}

function cacheCoordinates(request, source) {
  if (!request?.id || !hasPayloadCoordinates(source)) return;

  try {
    const current = JSON.parse(localStorage.getItem(COORDINATE_CACHE_KEY) || '{}');
    localStorage.setItem(COORDINATE_CACHE_KEY, JSON.stringify({
      ...current,
      [request.id]: {
        latitude: Number(source.latitude),
        longitude: Number(source.longitude),
        location: source.location,
      },
    }));
  } catch {
    // Coordinate cache is a UI resilience layer; API writes should not fail because of storage.
  }
}

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

export async function createRequest(data) {
  const created = await request('/api/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  cacheCoordinates(created, data);

  return created;
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
