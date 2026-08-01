import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import client from '../api/client'
import { JobStatusTag } from '../components/StatusTag.jsx'

export default function JobDetailPage() {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({ candidate_name: '', candidate_email: '', resume_url: '' })

  useEffect(() => {
    client
      .get(`/jobs/${jobId}`)
      .then((res) => setJob(res.data))
      .catch(() => setError('This job could not be found.'))
      .finally(() => setLoading(false))
  }, [jobId])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      await client.post(`/jobs/${jobId}/applications`, form)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Could not submit your application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>
  if (error) return <div className="alert alert-error">{error}</div>
  if (!job) return null

  return (
    <div>
      <Link to="/" className="eyebrow" style={{ display: 'inline-block', marginBottom: 16 }}>
        ← Back to open jobs
      </Link>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="job-card-top" style={{ marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 22 }}>{job.title}</h1>
            <div className="job-meta" style={{ marginTop: 6 }}>
              {job.location && <span>{job.location}</span>}
              {job.employment_type && <span>{job.employment_type}</span>}
            </div>
          </div>
          <JobStatusTag status={job.status} />
        </div>
        <p className="job-desc" style={{ whiteSpace: 'pre-line' }}>{job.description}</p>
      </div>

      {job.status !== 'open' && (
        <div className="alert alert-error">This job is closed and is no longer accepting applications.</div>
      )}

      {job.status === 'open' && !submitted && (
        <div className="card">
          <span className="eyebrow">Apply Now</span>
          <h2 style={{ fontSize: 18, margin: '6px 0 18px' }}>Submit your application</h2>
          {submitError && <div className="alert alert-error">{submitError}</div>}
          <form className="stack" onSubmit={handleSubmit}>
            <div className="field">
              <label>Full name</label>
              <input name="candidate_name" required value={form.candidate_name} onChange={handleChange} placeholder="Jane Doe" />
            </div>
            <div className="field">
              <label>Email address</label>
              <input type="email" name="candidate_email" required value={form.candidate_email} onChange={handleChange} placeholder="jane@example.com" />
              <span className="hint">We'll use this to let you track your application status later.</span>
            </div>
            <div className="field">
              <label>Resume URL</label>
              <input name="resume_url" required value={form.resume_url} onChange={handleChange} placeholder="https://drive.google.com/..." />
              <span className="hint">Link to your resume — Google Drive, Dropbox, portfolio, or LinkedIn.</span>
            </div>
            <div>
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}

      {submitted && (
        <div className="alert alert-success">
          Application submitted! You can track its status anytime on the{' '}
          <Link to="/track" style={{ fontWeight: 700 }}>Track Application</Link> page using your email.
        </div>
      )}
    </div>
  )
}
