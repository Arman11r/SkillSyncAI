import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()
  const steps = [
    { label: 'Upload',     path: '/' },
    { label: 'Assessment', path: '/assessment' },
    { label: 'Results',    path: '/results' },
  ]

  const activeIndex = steps.findIndex(s =>
    pathname === '/' ? s.path === '/' : pathname.startsWith(s.path) && s.path !== '/'
  )

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <span className="logo-bracket">[</span>
        SkillSync
        <span className="logo-dot">.</span>
        AI
        <span className="logo-bracket">]</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {steps.map((s, i) => (
          <div
            key={s.label}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                color: i === activeIndex
                  ? 'var(--cyan)'
                  : i < activeIndex
                    ? 'var(--green)'
                    : 'var(--text-muted)',
                letterSpacing: '0.05em',
                transition: 'color 0.2s',
              }}
            >
              {i < activeIndex ? '✓ ' : `${i + 1}. `}{s.label}
            </span>
            {i < steps.length - 1 && (
              <span style={{ color: 'var(--border-2)', fontSize: 12 }}>›</span>
            )}
          </div>
        ))}
      </div>

      <span className="navbar-badge">BETA</span>
    </nav>
  )
}
