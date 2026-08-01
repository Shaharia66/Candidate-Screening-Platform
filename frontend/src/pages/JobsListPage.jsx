import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { JobStatusTag } from '../components/StatusTag.jsx'

export default function JobsListPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client
      .get('/jobs')
      .then((res) => setJobs(res.data))
      .catch(() => setError('Could not load jobs right now. Please try again shortly.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Now Hiring</span>
          <h1>Open Positions</h1>
          <p className="page-subtitle">Browse current openings and apply directly — no account needed.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={{ color: 'var(--ink-soft)' }}>Loading jobs…</p>}

      {!loading && jobs.length === 0 && !error && (
        <div className="empty-state card">
          <span className="eyebrow">Nothing here yet</span>
          <p>There are no open positions right now. Check back soon.</p>
        </div>
      )}

      {jobs.map((job) => (
        <div className="card job-card" key={job.id}>
          <div className="job-card-top">
            <div>
              <div className="job-title">{job.title}</div>
              <div className="job-meta">
                {job.location && <span>{job.location}</span>}
                {job.employment_type && <span>{job.employment_type}</span>}
              </div>
            </div>
            <JobStatusTag status={job.status} />
          </div>
          <p className="job-desc">
            {job.description.length > 220 ? job.description.slice(0, 220) + '…' : job.description}
          </p>
          <div>
            <Link to={`/jobs/${job.id}`} className="btn btn-primary btn-sm">
              View & Apply
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
