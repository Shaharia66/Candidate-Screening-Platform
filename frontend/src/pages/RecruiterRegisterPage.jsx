import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function RecruiterRegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/recruiter/jobs')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <div className="card">
        <span className="eyebrow">Recruiter Access</span>
        <h1 style={{ fontSize: 22, margin: '6px 0 20px' }}>Create your account</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form className="stack" onSubmit={handleSubmit}>
          <div className="field">
            <label>Full name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Work email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <span className="hint">At least 6 characters.</span>
          </div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
        </form>
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-soft)' }}>
          Already have an account? <Link to="/recruiter/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  )
}
