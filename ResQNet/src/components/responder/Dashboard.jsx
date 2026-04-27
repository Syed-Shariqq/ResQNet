import { useState, useEffect } from 'react'
import { getAllRequests, assignRequest, resolveRequest } from '../../lib/api'
import { useNetworkState } from '../../engine/networkDetector'
import NetworkBadge from '../shared/NetworkBadge'
import SeverityBadge from '../shared/SeverityBadge'
import RequestCard from './RequestCard'

const FILTERS = ['all', 'critical', 'pending', 'assigned', 'resolved']

function timeAgoRefresh(date) {
  if (!date) return 'never'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.floor(seconds / 60)}m ago`
}

export default function Dashboard() {
  const { networkState } = useNetworkState()
  const [requests,      setRequests]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState('all')
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [tick,          setTick]          = useState(0)   // drives timeAgo re-render

  const fetchRequests = async () => {
    try {
      const data = await getAllRequests()
      setRequests(data)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
    const pollId = setInterval(fetchRequests, 8000)
    const tickId = setInterval(() => setTick(t => t + 1), 5000)
    return () => {
      clearInterval(pollId)
      clearInterval(tickId)
    }
  }, [])

  const handleAssign = async (id) => {
    const name = window.prompt('Enter responder name:')
    if (!name?.trim()) return
    try {
      const updated = await assignRequest(id, name.trim())
      setRequests(prev => prev.map(r => r.id === id ? updated : r))
    } catch (err) {
      console.error('Assign failed:', err)
    }
  }

  const handleResolve = async (id) => {
    try {
      const updated = await resolveRequest(id)
      setRequests(prev => prev.map(r => r.id === id ? updated : r))
    } catch (err) {
      console.error('Resolve failed:', err)
    }
  }

  // Stats
  const pending  = requests.filter(r => r.status === 'pending').length
  const assigned = requests.filter(r => r.status === 'assigned').length
  const resolved = requests.filter(r => r.status === 'resolved').length
  const critical = requests.filter(r => r.severity === 'critical').length

  // Filtered list
  const filteredRequests = requests.filter(r => {
    if (filter === 'all')      return true
    if (filter === 'critical') return r.severity === 'critical'
    return r.status === filter
  })

  const stats = [
    { label: 'Pending',  value: pending,  color: 'var(--color-blue)' },
    { label: 'Assigned', value: assigned, color: 'var(--color-amber)' },
    { label: 'Resolved', value: resolved, color: 'var(--color-green)' },
    {
      label: 'Critical',
      value: critical,
      color: 'var(--color-red-primary)',
      glow: critical > 0,
    },
  ]

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
        <span
          className="font-bold text-white text-lg"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          ⚡ ResQNet Command
        </span>

        <span
          className="text-xs hidden sm:block"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          Last sync: {timeAgoRefresh(lastRefreshed)}
        </span>

        <NetworkBadge networkState={networkState} />
      </nav>

      {/* MAIN */}
      <main
        className="min-h-screen pt-20 p-6"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        {/* STATS ROW */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 text-center"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                boxShadow: s.glow ? '0 0 20px rgba(220,38,38,0.2)' : 'none',
              }}
            >
              <div
                className="text-3xl font-bold"
                style={{ color: s.color, fontFamily: 'var(--font-mono)' }}
              >
                {s.value}
              </div>
              <div
                className="text-xs uppercase tracking-wider mt-1"
                style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* FILTER TABS */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors capitalize"
              style={{
                fontFamily: 'var(--font-mono)',
                background: filter === f ? 'var(--color-red-primary)' : 'var(--color-bg-elevated)',
                color: filter === f ? '#ffffff' : 'var(--color-text-secondary)',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center gap-4 mt-24">
            <div
              className="w-10 h-10 rounded-full animate-spin"
              style={{
                border: '2px solid var(--color-border-subtle)',
                borderTop: '2px solid var(--color-red-primary)',
              }}
            />
            <span
              className="text-sm"
              style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              Loading requests...
            </span>
          </div>
        )}

        {/* REQUEST GRID */}
        {!loading && filteredRequests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRequests.map(r => (
              <RequestCard
                key={r.id}
                request={r}
                onAssign={handleAssign}
                onResolve={handleResolve}
              />
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredRequests.length === 0 && (
          <p
            className="text-sm text-center mt-12"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            No requests in this category
          </p>
        )}
      </main>
    </>
  )
}
