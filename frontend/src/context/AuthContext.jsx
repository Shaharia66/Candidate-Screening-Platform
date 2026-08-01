import { createContext, useContext, useState, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [recruiter, setRecruiter] = useState(() => {
    const saved = localStorage.getItem('hb_recruiter')
    return saved ? JSON.parse(saved) : null
  })

  const login = useCallback(async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password })
    localStorage.setItem('hb_token', data.access_token)
    localStorage.setItem('hb_recruiter', JSON.stringify(data.recruiter))
    setRecruiter(data.recruiter)
    return data.recruiter
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await client.post('/auth/register', { name, email, password })
    localStorage.setItem('hb_token', data.access_token)
    localStorage.setItem('hb_recruiter', JSON.stringify(data.recruiter))
    setRecruiter(data.recruiter)
    return data.recruiter
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('hb_token')
    localStorage.removeItem('hb_recruiter')
    setRecruiter(null)
  }, [])

  return (
    <AuthContext.Provider value={{ recruiter, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
