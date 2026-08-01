import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import client from '../api/client'

const EMPTY = { title: '', description: '', location: '', employment_type: 'Full-time' }

export default function JobFormPage() {
  const { jobId } = useParams()
  const isEdit = Boolean(jobId)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    client
      .get(`/jobs/${jobId}`)
      .then((res) => {
        const { title, description, location, employment_type } = res.data
        setForm({ title, description, location: location || '', employment_type: employment_type || '' })
      })
      .catch(() => setError('Could not load this job.'))
      .finally(() => setLoading(false))
  }, [jobId, isEdit])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isEdit) {
        await client.put(`/jobs/${jobId}`, form)
      } else {
        await client.post('/jobs', form)
      }
      navigate('/recruiter/jobs')
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save this job.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">{isEdit ? 'Edit Job' : 'New Job'}</span>
          <h1>{isEdit ? 'Edit job posting' : 'Post a new job'}</h1>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-error">{error}</div>}
        <form className="stack" onSubmit={handleSubmit}>
          <div className="field">
            <label>Job title</label>
            <input name="title" required value={form.title} onChange={handleChange} placeholder="e.g. Senior Backend Engineer" />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea name="description" required value={form.description} onChange={handleChange} placeholder="Responsibilities, requirements, benefits…" />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Location</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Remote, Dhaka" />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Employment type</label>
              <select name="employment_type" value={form.employment_type} onChange={handleChange}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Post Job'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/recruiter/jobs')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
