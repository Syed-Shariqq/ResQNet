import RequestForm from '../components/citizen/RequestForm'

export default function CitizenPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <RequestForm />
      <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
        <span
          onClick={() => window.location.href = '/responder'}
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          Responder Dashboard →
        </span>
      </div>
    </div>
  )
}
