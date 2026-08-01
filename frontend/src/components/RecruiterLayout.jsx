import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RecruiterLayout() {
  const { recruiter, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <span className="dot" />
          HireBoard
        </div>
        <NavLink to="/recruiter/jobs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
          Jobs
        </NavLink>
        <NavLink to="/recruiter/jobs/new" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          Post a Job
        </NavLink>
        <div className="sidebar-footer">
          <div className="recruiter-name">{recruiter?.name}</div>
          <div className="recruiter-email">{recruiter?.email}</div>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
