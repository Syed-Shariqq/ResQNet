import { useState } from 'react';
import { useNetworkState } from '../../engine/networkDetector';
import { submitRequest } from '../../engine/resilienceEngine';
import { triageRequest } from '../../engine/triageEngine';
import Card from '../shared/Card';
import ChannelIndicator from '../shared/ChannelIndicator';
import NetworkBadge from '../shared/NetworkBadge';
import RequestTracker from '../shared/RequestTracker';
import StatusBadge from '../shared/StatusBadge';

export default function RequestForm() {
  const { networkState } = useNetworkState();
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [step, setStep] = useState('idle');
  const [triageResult, setTriageResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const isWorking = step === 'triaging' || step === 'submitting';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!description.trim() || !location.trim()) return;

    try {
      setErrorMsg('');
      setStep('triaging');
      const triage = await triageRequest(description, location);
      setTriageResult(triage);

      setStep('submitting');
      const result = await submitRequest({ description, location }, triage, networkState);
      setSubmitResult(result);
      setStep('done');
    } catch (error) {
      setStep('error');
      setErrorMsg(error.message);
    }
  };

  const handleReset = () => {
    setDescription('');
    setLocation('');
    setStep('idle');
    setTriageResult(null);
    setSubmitResult(null);
    setErrorMsg('');
  };

  return (
    <main className="citizen-page">
      <div className="citizen-container">
        <header className="citizen-header">
          <div>
            <p className="eyebrow">ResQNet Intake</p>
            <h1>Emergency Request</h1>
          </div>
          <div className="citizen-header__actions">
            <a className="button button--secondary" href="/">Command Center</a>
            <NetworkBadge networkState={networkState} />
          </div>
        </header>

        <div className="citizen-grid">
          <Card className="intake-card">
            {step === 'idle' && (
              <form className="intake-form" onSubmit={handleSubmit}>
                <div className="section-title">
                  <div>
                    <p className="eyebrow">New report</p>
                    <h2>Describe the situation</h2>
                  </div>
                </div>

                <label className="field">
                  <span>Situation description</span>
                  <textarea
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What happened, who is affected, and what immediate hazards exist?"
                    rows={5}
                    value={description}
                  />
                </label>

                <label className="field">
                  <span>Location</span>
                  <input
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Nearest address, landmark, shelter, or coordinates"
                    value={location}
                  />
                </label>

                <button
                  className="button button--danger button--full"
                  disabled={!description.trim() || !location.trim()}
                  type="submit"
                >
                  Submit Emergency Request
                </button>
              </form>
            )}

            {isWorking && (
              <div className="processing-state">
                <span className="spinner" />
                <h2>{step === 'triaging' ? 'Classifying urgency' : 'Routing request'}</h2>
                <p>The system is preparing the fastest available delivery path.</p>
              </div>
            )}

            {step === 'done' && (
              <div className="result-state">
                <div className="section-title">
                  <div>
                    <p className="eyebrow">Submitted</p>
                    <h2>Request is in the system</h2>
                  </div>
                </div>

                <div className="result-grid">
                  <div>
                    <span>Severity</span>
                    <StatusBadge
                      type="severity"
                      value={submitResult?.data?.severity || triageResult?.severity}
                    />
                  </div>
                  <div>
                    <span>Category</span>
                    <strong>{submitResult?.data?.category || triageResult?.category || 'unknown'}</strong>
                  </div>
                  <div>
                    <span>Channel</span>
                    <ChannelIndicator channel={submitResult?.channel || 'relay_queued'} />
                  </div>
                </div>

                <RequestTracker
                  channel={submitResult?.channel || 'relay_queued'}
                  requestId={submitResult?.data?.id || 'queued-request'}
                  status={submitResult?.data?.status || 'pending'}
                />

                {!submitResult?.synced && (
                  <div className="alert alert--warning">
                    Request stored locally. It will sync automatically when connectivity returns.
                  </div>
                )}

                <button className="button button--secondary button--full" onClick={handleReset} type="button">
                  Submit Another Request
                </button>
              </div>
            )}

            {step === 'error' && (
              <div className="result-state">
                <div className="section-title">
                  <div>
                    <p className="eyebrow">Submission failed</p>
                    <h2>Request was not sent</h2>
                  </div>
                </div>
                <div className="alert">{errorMsg || 'Unexpected intake error.'}</div>
                <button className="button button--secondary" onClick={handleReset} type="button">
                  Try Again
                </button>
              </div>
            )}
          </Card>

          <Card className="intake-brief">
            <p className="eyebrow">Routing assurance</p>
            <h2>Multichannel delivery</h2>
            <p>
              Online requests are delivered directly. Degraded networks fall back to compressed SMS.
              Offline requests stay queued for relay sync.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
