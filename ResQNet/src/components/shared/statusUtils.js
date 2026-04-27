const knownSeverities = new Set(['critical', 'high', 'medium', 'low']);

export function normalizeToken(value, fallback = 'unknown') {
  return String(value || fallback).trim().toLowerCase();
}

export function getSeverityTone(severity) {
  const normalized = normalizeToken(severity, 'low');
  return knownSeverities.has(normalized) ? normalized : 'low';
}
