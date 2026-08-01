import axios from 'axios'

// On Vercel, VITE_API_URL is set to the FastAPI Cloud backend URL (e.g.
// https://your-backend-app.fastapicloud.dev/api). In local dev without it
// set, requests fall back to a relative /api path.
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