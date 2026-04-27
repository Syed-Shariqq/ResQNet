import { useState } from 'react';
import Card from '../shared/Card';
import { createRequest } from '../../lib/api';

const severities = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function QuickRequestPanel({ onCreated, onError }) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState('high');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = description.trim() && location.trim() && !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const saved = await createRequest({
        description: description.trim(),
        location: location.trim(),
        severity,
        category: 'field-report',
        status: 'pending',
        channelUsed: navigator.onLine ? 'internet' : 'relay_queued',
      });

      setDescription('');
      setLocation('');
      setSeverity('high');
      onCreated?.(saved);
    } catch (error) {
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
          <label className="field">
            <span>Location</span>
            <input
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Landmark or lat,lng"
              value={location}
            />
          </label>

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

        <button className="button button--danger button--full" disabled={!canSubmit} type="submit">
          {submitting ? 'Submitting Request' : 'Submit Emergency Request'}
        </button>
      </form>
    </Card>
  );
}
