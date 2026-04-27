import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Card from './Card';
import { getSeverityTone, normalizeToken } from './statusUtils';

const DEFAULT_CENTER = [20.5937, 78.9629];

const markerLabels = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function hashValue(value) {
  return String(value || 'request').split('').reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }, 0);
}

function parseCoordinateText(value) {
  const match = String(value || '').match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  return [lat, lng];
}

function getRequestCoordinates(request, index = 0) {
  const directLat = Number(request.latitude ?? request.lat);
  const directLng = Number(request.longitude ?? request.lng);
  if (Number.isFinite(directLat) && Number.isFinite(directLng)) {
    return [directLat, directLng];
  }

  const parsed = parseCoordinateText(request.location);
  if (parsed) return parsed;

  const seed = Math.abs(hashValue(`${request.id || index}-${request.location || ''}`));
  const angle = ((seed % 360) * Math.PI) / 180;
  const radius = 0.55 + ((seed % 100) / 100) * 1.8;

  return [
    DEFAULT_CENTER[0] + Math.sin(angle) * radius,
    DEFAULT_CENTER[1] + Math.cos(angle) * radius * 1.25,
  ];
}

function getResponderOrigin(target, seed) {
  const angle = (((seed % 360) + 135) * Math.PI) / 180;
  const radius = 0.42 + ((seed % 40) / 100);

  return [
    target[0] + Math.sin(angle) * radius,
    target[1] + Math.cos(angle) * radius,
  ];
}

function makeMarkerIcon(request, selectedId) {
  const severity = getSeverityTone(request.severity);
  const isActive = normalizeToken(request.status) !== 'resolved';
  const isSelected = request.id === selectedId;

  return L.divIcon({
    className: 'map-marker-shell',
    html: `
      <button class="map-marker map-marker--${severity} ${isActive ? 'is-active' : ''} ${isSelected ? 'is-selected' : ''}" type="button" aria-label="${markerLabels[severity]} request">
        <span class="map-marker__pulse"></span>
        <span class="map-marker__core"></span>
      </button>
    `,
    iconAnchor: [16, 16],
    iconSize: [32, 32],
  });
}

function makeResponderIcon() {
  return L.divIcon({
    className: 'responder-marker-shell',
    html: '<span class="responder-marker"><span></span></span>',
    iconAnchor: [8, 8],
    iconSize: [16, 16],
  });
}

function makePopup(request) {
  return `
    <div class="map-popup-content">
      <strong>${escapeHtml(request.description || 'Emergency request')}</strong>
      <span>Status: ${escapeHtml(request.status || 'pending')}</span>
      <span>Channel: ${escapeHtml(request.channelUsed || 'internet')}</span>
    </div>
  `;
}

export default function MapView({ requests = [], selectedRequestId, onSelectRequest }) {
  const nodeRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const responderLayerRef = useRef(null);
  const markersRef = useRef(new Map());
  const fitSignatureRef = useRef('');

  useEffect(() => {
    if (!nodeRef.current || mapRef.current) return undefined;

    const map = L.map(nodeRef.current, {
      attributionControl: false,
      scrollWheelZoom: false,
      zoomControl: false,
    }).setView(DEFAULT_CENTER, 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('&copy; OpenStreetMap')
      .addTo(map);

    mapRef.current = map;
    markerLayerRef.current = L.layerGroup().addTo(map);
    responderLayerRef.current = L.layerGroup().addTo(map);

    const markers = markersRef.current;

    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      responderLayerRef.current = null;
      markers.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();
    markersRef.current.clear();

    const bounds = [];

    requests.forEach((request, index) => {
      const coordinates = getRequestCoordinates(request, index);
      bounds.push(coordinates);

      const marker = L.marker(coordinates, {
        icon: makeMarkerIcon(request, selectedRequestId),
        keyboard: true,
      });

      marker.bindPopup(makePopup(request), {
        className: 'map-popup',
        closeButton: false,
      });

      marker.on('click', () => onSelectRequest?.(request));
      marker.addTo(markerLayer);
      markersRef.current.set(request.id, marker);
    });

    const selectedMarker = markersRef.current.get(selectedRequestId);
    if (selectedMarker) {
      map.panTo(selectedMarker.getLatLng(), { animate: true, duration: 0.45 });
      selectedMarker.openPopup();
      return;
    }

    const signature = requests.map((request) => request.id).join('|');
    if (bounds.length > 0 && signature !== fitSignatureRef.current) {
      map.fitBounds(bounds, { maxZoom: 7, padding: [24, 24] });
      fitSignatureRef.current = signature;
    }
  }, [onSelectRequest, requests, selectedRequestId]);

  useEffect(() => {
    const responderLayer = responderLayerRef.current;
    if (!responderLayer) return undefined;

    responderLayer.clearLayers();

    const assignedRequests = requests.filter((request) => normalizeToken(request.status) === 'assigned');
    if (assignedRequests.length === 0) return undefined;

    const responders = assignedRequests.map((request, index) => {
      const target = getRequestCoordinates(request, index);
      const seed = Math.abs(hashValue(request.id || index));
      const origin = getResponderOrigin(target, seed);
      const marker = L.marker(origin, { icon: makeResponderIcon(), interactive: false }).addTo(responderLayer);

      return { index, marker, origin, target };
    });

    let frameId;

    const tick = () => {
      const now = Date.now();
      responders.forEach(({ index, marker, origin, target }) => {
        const phase = ((now / 5200) + index * 0.21) % 1;
        const eased = phase < 0.5 ? phase * 1.7 : 0.85 - (phase - 0.5) * 0.28;
        marker.setLatLng([
          origin[0] + (target[0] - origin[0]) * eased,
          origin[1] + (target[1] - origin[1]) * eased,
        ]);
      });
      frameId = window.requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.cancelAnimationFrame(frameId);
      responderLayer.clearLayers();
    };
  }, [requests]);

  return (
    <Card className="map-card">
      <div className="section-title">
        <div>
          <p className="eyebrow">Live Map</p>
          <h2>Incident Geography</h2>
        </div>
        <span className="map-count">{requests.length} tracked</span>
      </div>

      <div className="map-view__canvas" ref={nodeRef} />

      <div className="map-legend" aria-label="Map legend">
        {['critical', 'high', 'medium'].map((severity) => (
          <span className={`map-legend__item map-legend__item--${severity}`} key={severity}>
            <span />
            {markerLabels[severity]}
          </span>
        ))}
      </div>
    </Card>
  );
}
