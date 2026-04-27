/**
 * MainLayout.jsx — Reusable page shell.
 *
 * Slots:
 *   - header : fixed top bar content (optional override)
 *   - sidebar : right-side panel (optional)
 *   - children: main content area
 *
 * ChannelStatus is rendered globally in App.jsx (above the router),
 * so it always sits at the very top of every page automatically.
 * RequestTracker is embedded inside RequestForm and appears post-submit.
 */
export default function MainLayout({ children, sidebar, header }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
        position: 'relative',
      }}
    >
      {/* Optional header override (most pages use RequestForm's own nav) */}
      {header && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 60,
          }}
        >
          {header}
        </div>
      )}

      {/* Main content — left/center column */}
      <div>{children}</div>

      {/* Optional right sidebar — fixed, visible on lg+ screens only */}
      {sidebar && (
        <aside
          style={{
            position: 'fixed',
            top: '5rem',
            right: '1.5rem',
            width: '300px',
            zIndex: 40,
            display: 'none', // overridden by media query below
          }}
          className="lg-sidebar"
        >
          {sidebar}
        </aside>
      )}

      {/*
        Inline media query: show sidebar only on screens ≥ 1280px
        (wide enough that RequestForm's centered card doesn't overlap)
      */}
      <style>{`
        @media (min-width: 1280px) {
          .lg-sidebar { display: block !important; }
        }
      `}</style>
    </div>
  )
}
