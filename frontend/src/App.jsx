import { Routes, Route } from 'react-router-dom'

import PublicLayout from './components/PublicLayout.jsx'
import RecruiterLayout from './components/RecruiterLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import JobsListPage from './pages/JobsListPage.jsx'
import JobDetailPage from './pages/JobDetailPage.jsx'
import TrackApplicationPage from './pages/TrackApplicationPage.jsx'
import RecruiterLoginPage from './pages/RecruiterLoginPage.jsx'
import RecruiterRegisterPage from './pages/RecruiterRegisterPage.jsx'
import RecruiterJobsPage from './pages/RecruiterJobsPage.jsx'
import JobFormPage from './pages/JobFormPage.jsx'
import ApplicationsReviewPage from './pages/ApplicationsReviewPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<JobsListPage />} />
        <Route path="/jobs/:jobId" element={<JobDetailPage />} />
        <Route path="/track" element={<TrackApplicationPage />} />
        <Route path="/recruiter/login" element={<RecruiterLoginPage />} />
        <Route path="/recruiter/register" element={<RecruiterRegisterPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <RecruiterLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/recruiter/jobs" element={<RecruiterJobsPage />} />
        <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
        <Route path="/recruiter/jobs/:jobId/edit" element={<JobFormPage />} />
        <Route path="/recruiter/jobs/:jobId/applications" element={<ApplicationsReviewPage />} />
      </Route>
    </Routes>
  )
}
