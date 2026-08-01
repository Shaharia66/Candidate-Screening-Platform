import { useState } from 'react'
import client from '../api/client'
import { ApplicationStatusTag } from '../components/StatusTag.jsx'

export default function TrackApplicationPage() {
  const [email, setEmail] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setSearched(true)
    try {
      const res = await client.get('/applications/track', { params: { email } })
      setResults(res.data)
    } catch (err) {
      setError('Something went wrong while looking up your applications.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Application Status</span>
          <h1>Track Your Application</h1>
          <p className="page-subtitle">Enter the email you applied with to see the status of all your applications.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <form className="stack" onSubmit={handleSearch}>
          <div className="field">
            <label>Email address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching…' : 'Check Status'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {searched && !loading && results && results.length === 0 && (
        <div className="empty-state card">
          <span className="eyebrow">No results</span>
          <p>No applications found for this email address.</p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Applied</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((app) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600 }}>{app.job_title}</td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td><ApplicationStatusTag status={app.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
