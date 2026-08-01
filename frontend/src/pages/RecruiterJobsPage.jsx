import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { JobStatusTag } from '../components/StatusTag.jsx'

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const loadJobs = () => {
    setLoading(true)
    client
      .get('/jobs/recruiter/mine')
      .then((res) => setJobs(res.data))
      .catch(() => setError('Could not load your jobs.'))
      .finally(() => setLoading(false))
  }

  useEffect(loadJobs, [])

  const toggleStatus = async (job) => {
    setActionError('')
    try {
      const action = job.status === 'open' ? 'close' : 'reopen'
      await client.patch(`/jobs/${job.id}/${action}`)
      loadJobs()
    } catch (err) {
      setActionError('Could not update job status.')
    }
  }

  const openCount = jobs.filter((j) => j.status === 'open').length
  const totalApplications = jobs.reduce((sum, j) => sum + (j.application_count || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Recruiter Dashboard</span>
          <h1>Your Jobs</h1>
        </div>
        <Link to="/recruiter/jobs/new" className="btn btn-primary">+ Post a Job</Link>
      </div>

      <div className="stat-strip">
        <div className="stat-box"><div className="num">{jobs.length}</div><div className="label">Total jobs</div></div>
        <div className="stat-box"><div className="num">{openCount}</div><div className="label">Open</div></div>
        <div className="stat-box"><div className="num">{totalApplications}</div><div className="label">Applications received</div></div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {actionError && <div className="alert alert-error">{actionError}</div>}
      {loading && <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>}

      {!loading && jobs.length === 0 && (
        <div className="empty-state card">
          <span className="eyebrow">No jobs yet</span>
          <p>Post your first job to start receiving applications.</p>
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
                <span>{job.application_count} application{job.application_count === 1 ? '' : 's'}</span>
              </div>
            </div>
            <JobStatusTag status={job.status} />
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to={`/recruiter/jobs/${job.id}/applications`} className="btn btn-secondary btn-sm">
              Review Applications
            </Link>
            <Link to={`/recruiter/jobs/${job.id}/edit`} className="btn btn-secondary btn-sm">
              Edit
            </Link>
            <button
              className={job.status === 'open' ? 'btn btn-danger-outline btn-sm' : 'btn btn-secondary btn-sm'}
              onClick={() => toggleStatus(job)}
            >
              {job.status === 'open' ? 'Close Job' : 'Reopen Job'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
