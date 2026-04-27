const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function fetchWithHandling(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error('NETWORK_UNAVAILABLE');
  }

  if (!response.ok) {
    throw new Error('API_ERROR:' + response.status);
  }

  return await response.json();
}

export async function createRequest(data) {
  return await fetchWithHandling(`${BASE_URL}/api/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function getAllRequests() {
  return await fetchWithHandling(`${BASE_URL}/api/requests`);
}

export async function assignRequest(id, responderName) {
  return await fetchWithHandling(`${BASE_URL}/api/requests/${id}/assign?responderName=${encodeURIComponent(responderName)}`, {
    method: 'PUT',
  });
}

export async function resolveRequest(id) {
  return await fetchWithHandling(`${BASE_URL}/api/requests/${id}/resolve`, {
    method: 'PUT',
  });
}

export async function syncOfflineRequests(requestsArray) {
  return await fetchWithHandling(`${BASE_URL}/api/requests/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestsArray),
  });
}
