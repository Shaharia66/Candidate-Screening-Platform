import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import client from '../api/client'
import { ApplicationStatusTag } from '../components/StatusTag.jsx'

const STATUS_OPTIONS = ['applied', 'shortlisted', 'interview', 'rejected', 'hired']

export default function ApplicationsReviewPage() {
  const { jobId } = useParams()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      client.get(`/jobs/${jobId}`),
      client.get(`/jobs/${jobId}/applications`),
    ])
      .then(([jobRes, appsRes]) => {
        setJob(jobRes.data)
        setApplications(appsRes.data)
      })
      .catch(() => setError('Could not load applications for this job.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [jobId])

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingId(applicationId)
    try {
      await client.patch(`/applications/${applicationId}/status`, { status: newStatus })
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
      )
    } catch (err) {
      setError('Could not update status. Please try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>

  return (
    <div>
      <Link to="/recruiter/jobs" className="eyebrow" style={{ display: 'inline-block', marginBottom: 16 }}>
        ← Back to jobs
      </Link>

      <div className="page-header">
        <div>
          <span className="eyebrow">Applications</span>
          <h1>{job?.title}</h1>
          <p className="page-subtitle">{applications.length} candidate{applications.length === 1 ? '' : 's'} applied</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {applications.length === 0 ? (
        <div className="empty-state card">
          <span className="eyebrow">No applications yet</span>
          <p>Candidates who apply to this job will show up here.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Email</th>
                <th>Resume</th>
                <th>Applied</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 600 }}>{app.candidate_name}</td>
                  <td>{app.candidate_email}</td>
                  <td>
                    <a href={app.resume_url} target="_blank" rel="noreferrer" className="resume-link">
                      View Resume ↗
                    </a>
                  </td>
                  <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ApplicationStatusTag status={app.status} />
                      <select
                        className="select-status"
                        value={app.status}
                        disabled={updatingId === app.id}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        style={{ width: 'auto', padding: '4px 6px' }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
