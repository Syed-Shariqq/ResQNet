import { useState } from 'react'
import { useNetworkState } from '../../engine/networkDetector'
import { triageRequest } from '../../engine/triageEngine'
import { submitRequest } from '../../engine/resilienceEngine'
import NetworkBadge from '../shared/NetworkBadge'
import SeverityBadge from '../shared/SeverityBadge'

const channelDisplay = {
  internet:       { icon: '🌐', label: 'Transmitted via Internet', color: 'var(--color-green)' },
  sms_compressed: { icon: '📡', label: 'Compressed SMS Channel',   color: 'var(--color-amber)' },
  relay_queued:   { icon: '💾', label: 'Stored — Awaiting Sync',   color: '#ef4444' },
}

export default function RequestForm() {
  const { networkState } = useNetworkState()

  const [description, setDescription]   = useState('')
  const [location, setLocation]         = useState('')
  const [step, setStep]                 = useState('idle')
  const [triageResult, setTriageResult] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)
  const [errorMsg, setErrorMsg]         = useState('')

  // Focus border state
  const [descFocused, setDescFocused] = useState(false)
  const [locFocused,  setLocFocused]  = useState(false)

  // Submit button hover state
  const [btnHovered, setBtnHovered] = useState(false)

  const handleSubmit = async () => {
    if (!description.trim() || !location.trim()) return
    try {
      setStep('triaging')
      const triage = await triageRequest(description, location)
      setTriageResult(triage)
      await new Promise(r => setTimeout(r, 1200))
      setStep('submitting')
      const result = await submitRequest({ description, location }, triage, networkState)
      setSubmitResult(result)
      setStep('done')
    } catch (error) {
      setStep('error')
      setErrorMsg(error.message)
    }
  }

  const handleReset = () => {
    setDescription('')
    setLocation('')
    setStep('idle')
    setTriageResult(null)
    setSubmitResult(null)
    setErrorMsg('')
  }

  const inputBase = {
    background: 'var(--color-bg-elevated)',
    color: 'var(--color-text-primary)',
    fontFamily: 'var(--font-sans)',
  }

  const Spinner = () => (
    <div
      className="w-10 h-10 rounded-full animate-spin mx-auto"
      style={{
        border: '2px solid var(--color-border-subtle)',
        borderTop: '2px solid var(--color-red-primary)',
      }}
    />
  )

  return (
    <>
      {/* FIXED NAVBAR */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6 py-3 flex justify-between items-center"
        style={{
          background: 'var(--color-bg-primary)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center">
          <span
            className="font-bold text-lg text-white"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            ⚡ ResQNet
          </span>
          <span className="w-2 h-2 bg-red-600 rounded-full ml-2 animate-pulse" />
        </div>
        <NetworkBadge networkState={networkState} />
      </nav>

      {/* MAIN */}
      <main
        className="min-h-screen pt-20 flex items-center justify-center px-4"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        {/* CARD */}
        <div
          className="max-w-md w-full rounded-2xl p-8"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >

          {/* ── IDLE ── */}
          {step === 'idle' && (
            <>
              <h1
                className="text-2xl font-bold mb-1"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
              >
                Emergency Request
              </h1>
              <p
                className="text-sm mb-6"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                Submit through any available channel
              </p>

              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                onFocus={() => setDescFocused(true)}
                onBlur={() => setDescFocused(false)}
                placeholder="Describe the emergency — what happened, how many people affected..."
                className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-colors"
                style={{
                  ...inputBase,
                  border: descFocused
                    ? '1px solid var(--color-red-primary)'
                    : '1px solid var(--color-border-subtle)',
                }}
              />

              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                onFocus={() => setLocFocused(true)}
                onBlur={() => setLocFocused(false)}
                placeholder="Your location or nearest landmark"
                className="w-full rounded-xl p-4 text-sm outline-none transition-colors mt-3"
                style={{
                  ...inputBase,
                  border: locFocused
                    ? '1px solid var(--color-red-primary)'
                    : '1px solid var(--color-border-subtle)',
                }}
              />

              <button
                onClick={handleSubmit}
                onMouseOver={() => setBtnHovered(true)}
                onMouseOut={() => setBtnHovered(false)}
                className="w-full py-4 mt-6 rounded-xl font-bold uppercase tracking-widest text-sm text-white transition-colors"
                style={{ background: btnHovered ? '#b91c1c' : 'var(--color-red-primary)' }}
              >
                SUBMIT EMERGENCY REQUEST
              </button>
            </>
          )}

          {/* ── TRIAGING ── */}
          {step === 'triaging' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Spinner />
              <p
                className="text-sm"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                Analyzing severity...
              </p>
              {triageResult && (
                <div className="flex flex-col items-center gap-2">
                  <SeverityBadge severity={triageResult.severity} />
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}
                  >
                    {triageResult.category}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── SUBMITTING ── */}
          {step === 'submitting' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Spinner />
              <p
                className="text-sm"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                Routing through available channel...
              </p>
            </div>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <>
              <div className="text-5xl text-center mb-4">✅</div>
              <h2
                className="text-xl font-bold text-center mb-6"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
              >
                Request Submitted
              </h2>

              <div className="flex flex-col gap-3">
                {/* Severity */}
                <div className="flex justify-between items-center">
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
                  >
                    Severity
                  </span>
                  <SeverityBadge severity={submitResult?.data?.severity || triageResult?.severity} />
                </div>

                {/* Category */}
                <div className="flex justify-between items-center">
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
                  >
                    Category
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: 'var(--color-bg-elevated)',
                      color: 'var(--color-text-secondary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {submitResult?.data?.category || triageResult?.category || 'unknown'}
                  </span>
                </div>

                {/* Channel */}
                <div className="flex justify-between items-center">
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
                  >
                    Channel
                  </span>
                  {(() => {
                    const ch = channelDisplay[submitResult?.channel] ?? channelDisplay.relay_queued
                    return (
                      <span
                        className="text-xs font-mono"
                        style={{ color: ch.color }}
                      >
                        {ch.icon} {ch.label}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Offline warning */}
              {!submitResult?.synced && (
                <div
                  className="mt-4 p-4 rounded-xl text-sm"
                  style={{
                    background: '#451a03',
                    border: '1px solid #92400e',
                    color: 'var(--color-amber)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  ⚠ Request stored locally. Will automatically sync when connection is restored.
                </div>
              )}

              <button
                onClick={handleReset}
                className="mt-6 w-full py-3 rounded-xl text-sm transition-colors"
                style={{
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-secondary)',
                  background: 'transparent',
                }}
              >
                Submit Another Request
              </button>
            </>
          )}

          {/* ── ERROR ── */}
          {step === 'error' && (
            <>
              <div className="text-5xl text-center mb-4">❌</div>
              <h2
                className="text-xl font-bold text-center mb-2"
                style={{ color: '#ef4444', fontFamily: 'var(--font-sans)' }}
              >
                Submission Failed
              </h2>
              <p
                className="text-sm text-center mb-6"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                {errorMsg}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl text-sm text-white transition-colors"
                  style={{ background: 'var(--color-bg-elevated)' }}
                >
                  Try Again
                </button>
              </div>
            </>
          )}

        </div>
      </main>
    </>
  )
}
