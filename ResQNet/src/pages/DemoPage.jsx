import { useState, useEffect, useRef } from 'react'
import { syncPendingRequests } from '../engine/syncEngine'
import { getQueue } from '../engine/resilienceEngine'

const NETWORK_BUTTONS = [
  {
    value:        'online',
    emoji:        '🌐',
    label:        'ONLINE',
    activeColor:  'var(--color-green)',
    activeBg:     '#052e16',
    activeShadow: '0 0 20px rgba(22,163,74,0.3)',
  },
  {
    value:        'degraded',
    emoji:        '📡',
    label:        'DEGRADED',
    activeColor:  'var(--color-amber)',
    activeBg:     '#431407',
    activeShadow: '0 0 20px rgba(217,119,6,0.3)',
  },
  {
    value:        'offline',
    emoji:        '💾',
    label:        'OFFLINE',
    activeColor:  'var(--color-red-primary)',
    activeBg:     '#450a0a',
    activeShadow: '0 0 20px rgba(220,38,38,0.3)',
  },
  {
    value:        null,
    emoji:        '↺',
    label:        'REAL NET',
    activeColor:  'var(--color-text-secondary)',
    activeBg:     'var(--color-bg-elevated)',
    activeShadow: 'none',
  },
]

function SectionLabel({ children }) {
  return (
    <p
      className="text-xs tracking-widest uppercase mb-4"
      style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </p>
  )
}

export default function DemoPage() {
  const [simulated,  setSimulated]  = useState(null)
  const [syncLog,    setSyncLog]    = useState([])
  const [queueCount, setQueueCount] = useState(0)
  const logRef = useRef(null)

  // Poll queue size every 2s
  useEffect(() => {
    const initialQueueId = setTimeout(() => setQueueCount(getQueue().length), 0)
    const id = setInterval(() => setQueueCount(getQueue().length), 2000)
    return () => {
      clearTimeout(initialQueueId)
      clearInterval(id)
    }
  }, [])

  // Auto-scroll log on new entries
  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight)
  }, [syncLog])

  const setSimulatedNetwork = (value) => {
    if (value === null) {
      localStorage.removeItem('resqnet_simulated_network')
    } else {
      localStorage.setItem('resqnet_simulated_network', value)
    }
    setSimulated(value)
  }

  const handleForceSync = async () => {
    const result = await syncPendingRequests()
    const message =
      result.synced > 0
        ? `Synced ${result.synced} requests to server`
        : result.failed > 0
        ? `Sync failed — ${result.failed} still queued`
        : 'Queue is empty — nothing to sync'
    setSyncLog(prev => [...prev, { time: new Date().toLocaleTimeString(), message }])
    setQueueCount(getQueue().length)
  }

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background:  'var(--color-bg-primary)',
        color:       'var(--color-text-primary)',
        fontFamily:  'var(--font-mono)',
      }}
    >
      {/* HEADER */}
      <div>
        <h1
          className="text-3xl font-bold tracking-widest"
          style={{ color: 'var(--color-red-primary)' }}
        >
          ⚡ RESQNET
        </h1>
        <p
          className="text-sm mt-1 uppercase"
          style={{ color: 'var(--color-text-muted)', letterSpacing: '0.3em' }}
        >
          DEMO CONTROL PANEL
        </p>
        <div
          className="mt-6 mb-8"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        />
      </div>

      {/* SECTION 1 — NETWORK SIMULATION */}
      <section>
        <SectionLabel>Network Simulation</SectionLabel>
        <div className="grid grid-cols-4 gap-3">
          {NETWORK_BUTTONS.map(btn => {
            const isActive = simulated === btn.value
            return (
              <button
                key={String(btn.value)}
                onClick={() => setSimulatedNetwork(btn.value)}
                className="rounded-xl px-4 py-5 text-center cursor-pointer transition-all flex flex-col items-center gap-2"
                style={{
                  background:  isActive ? btn.activeBg     : 'var(--color-bg-card)',
                  border:      isActive ? `2px solid ${btn.activeColor}` : '2px solid var(--color-border)',
                  boxShadow:   isActive ? btn.activeShadow : 'none',
                  color:       isActive ? btn.activeColor  : 'var(--color-text-secondary)',
                  fontFamily:  'var(--font-mono)',
                }}
              >
                <span className="text-2xl">{btn.emoji}</span>
                <span className="text-xs tracking-widest">{btn.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* SECTION 2 — QUEUE STATUS */}
      <section className="mt-10">
        <SectionLabel>Queue Status</SectionLabel>

        <div className="flex items-baseline gap-4">
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            QUEUED REQUESTS:
          </span>
          <span
            className="text-4xl font-bold"
            style={{ color: queueCount > 0 ? 'var(--color-red-primary)' : 'var(--color-text-muted)' }}
          >
            {queueCount}
          </span>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleForceSync}
            className="px-6 py-3 rounded-xl text-sm text-white tracking-widest transition-opacity hover:opacity-80"
            style={{ background: 'var(--color-red-primary)' }}
          >
            ⚡ FORCE SYNC
          </button>
          <button
            onClick={() => setQueueCount(getQueue().length)}
            className="px-6 py-3 rounded-xl text-sm tracking-widest transition-opacity hover:opacity-80"
            style={{
              background: 'var(--color-bg-elevated)',
              color:      'var(--color-text-secondary)',
            }}
          >
            ↺ REFRESH
          </button>
        </div>
      </section>

      {/* SECTION 3 — SYNC LOG */}
      <section className="mt-10">
        <div className="flex justify-between items-center mb-3">
          <SectionLabel>Sync Log</SectionLabel>
          <button
            onClick={() => setSyncLog([])}
            className="text-xs transition-colors hover:text-gray-400 -mt-4"
            style={{ color: 'var(--color-text-muted)' }}
          >
            CLEAR
          </button>
        </div>

        <div
          ref={logRef}
          className="h-44 overflow-y-auto rounded-xl p-4"
          style={{
            background: 'var(--color-bg-card)',
            border:     '1px solid var(--color-border)',
          }}
        >
          {syncLog.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-border-subtle)' }}>
              No sync events yet...
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {syncLog.map((entry, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {entry.time}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-green)' }}>
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4 — QUICK ACCESS */}
      <section className="mt-10 flex gap-4">
        <button
          onClick={() => window.open('/', '_blank')}
          className="px-6 py-3 rounded-xl text-sm tracking-widest cursor-pointer transition-opacity hover:opacity-80"
          style={{
            background: 'transparent',
            border:     '1px solid var(--color-blue)',
            color:      'var(--color-blue)',
          }}
        >
          CITIZEN VIEW ↗
        </button>
        <button
          onClick={() => window.open('/responder', '_blank')}
          className="px-6 py-3 rounded-xl text-sm tracking-widest cursor-pointer transition-opacity hover:opacity-80"
          style={{
            background: 'transparent',
            border:     '1px solid #7c3aed',
            color:      '#7c3aed',
          }}
        >
          RESPONDER VIEW ↗
        </button>
      </section>
    </div>
  )
}
