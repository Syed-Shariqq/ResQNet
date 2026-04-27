const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function splitAddress(displayName = '', fallbackName = '') {
  const parts = displayName.split(',').map((part) => part.trim()).filter(Boolean);
  const primary = fallbackName || parts[0] || displayName;
  const secondary = parts
    .filter((part, index) => index !== 0 || part !== primary)
    .slice(0, 4)
    .join(', ');

  return {
    primary,
    secondary,
  };
}

function normalizePlace(result) {
  const displayName = result.display_name || result.name || '';
  const address = splitAddress(displayName, result.name);
  const lat = toNumber(result.lat);
  const lng = toNumber(result.lon);

  return {
    id: `${result.place_id || displayName}-${result.lat}-${result.lon}`,
    displayName,
    primary: address.primary,
    secondary: address.secondary,
    lat,
    lng,
    type: result.type,
    category: result.category,
  };
}

function ensureValidCoordinates(place) {
  if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) {
    throw new Error('Select a valid location with coordinates.');
  }

  return place;
}

export function hasValidCoordinates(item) {
  const lat = toNumber(item?.latitude ?? item?.lat);
  const lng = toNumber(item?.longitude ?? item?.lng ?? item?.lon);

  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && Math.abs(lat) <= 90
    && Math.abs(lng) <= 180;
}

export function getCoordinates(item) {
  if (!hasValidCoordinates(item)) return null;

  return [
    Number(item.latitude ?? item.lat),
    Number(item.longitude ?? item.lng ?? item.lon),
  ];
}

export function normalizeSelectedLocation(place) {
  return ensureValidCoordinates({
    ...place,
    displayName: place.displayName || place.location || place.display_name,
    lat: Number(place.lat ?? place.latitude),
    lng: Number(place.lng ?? place.longitude ?? place.lon),
  });
}

export async function searchLocations(query, { signal } = {}) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    format: 'json',
    q: trimmed,
    limit: '5',
    addressdetails: '1',
  });

  let response;

  try {
    response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': navigator.language || 'en',
      },
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Location service unavailable');
  }

  if (!response.ok) {
    throw new Error('Location service unavailable');
  }

  const data = await response.json();
  return data.map(normalizePlace).filter(hasValidCoordinates);
}

export async function reverseGeocodeLocation(lat, lng, { signal } = {}) {
  const params = new URLSearchParams({
    format: 'json',
    lat: String(lat),
    lon: String(lng),
    zoom: '18',
    addressdetails: '1',
  });

  let response;

  try {
    response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': navigator.language || 'en',
      },
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Location service unavailable');
  }

  if (!response.ok) {
    throw new Error('Location service unavailable');
  }

  return normalizePlace(await response.json());
}

export async function resolveLocationFromText(query) {
  const results = await searchLocations(query);

  if (results.length === 0) {
    throw new Error('No valid location found. Select a location from suggestions.');
  }

  if (results.length > 1) {
    const exact = results.find((result) => result.displayName.toLowerCase() === query.trim().toLowerCase());
    if (exact) return exact;

    throw new Error('Select one location from the suggestions before submitting.');
  }

  return results[0];
}
