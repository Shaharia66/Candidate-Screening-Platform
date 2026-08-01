import { Link, Outlet, useLocation } from 'react-router-dom'

export default function PublicLayout() {
  const location = useLocation()
  return (
    <div className="public-shell">
      <nav className="public-nav">
        <Link to="/" className="brand-mark">
          <span className="dot" />
          HireBoard
        </Link>
        <div className="public-nav-links">
          <Link
            to="/"
            className="btn btn-sm btn-secondary"
            style={{ borderColor: location.pathname === '/' ? 'var(--brand)' : undefined }}
          >
            Open Jobs
          </Link>
          <Link to="/track" className="btn btn-sm btn-secondary">
            Track Application
          </Link>
          <Link to="/recruiter/login" className="btn btn-sm btn-primary">
            Recruiter Login
          </Link>
        </div>
      </nav>
      <main className="public-main">
        <Outlet />
      </main>
    </div>
  )
}
