import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { recruiter } = useAuth()
  if (!recruiter) {
    return <Navigate to="/recruiter/login" replace />
  }
  return children
}
