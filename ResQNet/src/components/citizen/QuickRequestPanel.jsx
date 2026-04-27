import { useState } from 'react';
import Card from '../shared/Card';
import LocationAutocomplete from '../shared/LocationAutocomplete';
import { createRequest } from '../../lib/api';
import {
  normalizeSelectedLocation,
  resolveLocationFromText,
} from '../../lib/locationService';

const severities = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function QuickRequestPanel({ onCreated, onError, onLocationPreview }) {
  const [description, setDescription] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [severity, setSeverity] = useState('high');
  const [submitting, setSubmitting] = useState(false);
  const [locationError, setLocationError] = useState('');

  const canSubmit = description.trim() && locationInput.trim() && !submitting;

  const handleLocationInput = (value) => {
    setLocationInput(value);
    setSelectedLocation(null);
    setLocationError('');
    onLocationPreview?.(null);
  };

  const handleLocationSelect = (place) => {
    const normalized = normalizeSelectedLocation(place);
    setSelectedLocation(normalized);
    setLocationInput(normalized.displayName);
    setLocationError('');
    onLocationPreview?.(normalized);
  };

  const resolveSubmitLocation = async () => {
    if (selectedLocation) return normalizeSelectedLocation(selectedLocation);

    try {
      const resolved = await resolveLocationFromText(locationInput);
      handleLocationSelect(resolved);
      return resolved;
    } catch (error) {
      setLocationError(error.message);
      throw error;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const place = await resolveSubmitLocation();
      const saved = await createRequest({
        description: description.trim(),
        location: place.displayName,
        latitude: place.lat,
        longitude: place.lng,
        severity,
        category: 'field-report',
        status: 'pending',
        channelUsed: navigator.onLine ? 'internet' : 'relay_queued',
      });

      const requestWithCoordinates = {
        ...saved,
        location: saved.location || place.displayName,
        latitude: Number(saved.latitude ?? place.lat),
        longitude: Number(saved.longitude ?? place.lng),
      };

      setDescription('');
      setLocationInput('');
      setSelectedLocation(null);
      setLocationError('');
      setSeverity('high');
      onLocationPreview?.(null);
      onCreated?.(requestWithCoordinates);
    } catch (error) {
      setLocationError(error.message);
      onError?.(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="quick-request-card">
      <div className="section-title">
        <div>
          <p className="eyebrow">Citizen Intake</p>
          <h2>Quick Emergency Request</h2>
        </div>
      </div>

      <form className="quick-request-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Description</span>
          <textarea
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Briefly describe the emergency"
            rows={3}
            value={description}
          />
        </label>

        <div className="quick-request-grid">
          <LocationAutocomplete
            label="Location"
            onError={(message) => {
              setLocationError(message);
              onError?.(message);
            }}
            onInputChange={handleLocationInput}
            onSelect={handleLocationSelect}
            placeholder="Search city, landmark, shelter, or address"
            selectedLocation={selectedLocation}
            value={locationInput}
          />

          <label className="field">
            <span>Severity</span>
            <select onChange={(event) => setSeverity(event.target.value)} value={severity}>
              {severities.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {locationError && (
          <div className="location-validation" role="alert">
            {locationError}
          </div>
        )}

        <button className="button button--danger button--full" disabled={!canSubmit} type="submit">
          {submitting ? 'Submitting Request' : 'Submit Emergency Request'}
        </button>
      </form>
    </Card>
  );
}
