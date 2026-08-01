import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RecruiterLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/recruiter/jobs')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <div className="card">
        <span className="eyebrow">Recruiter Access</span>
        <h1 style={{ fontSize: 22, margin: '6px 0 20px' }}>Log in</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form className="stack" onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-soft)' }}>
          New recruiter? <Link to="/recruiter/register" style={{ color: 'var(--brand)', fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  )
}
