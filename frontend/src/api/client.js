import axios from 'axios'

// In Docker, the frontend is served by nginx which proxies /api to the backend.
// In local dev (vite), VITE_API_URL can override this.
const baseURL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({ baseURL })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('hb_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
