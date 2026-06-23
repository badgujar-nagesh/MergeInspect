import axios from 'axios'

/**
 * In development:  requests go to /api  → Vite proxy → http://localhost:8000/api
 * In production:   requests go to /api  → served by Nginx on the same domain
 *
 * VITE_API_BASE_URL is only used by the Vite dev-server proxy (vite.config.js).
 * The axios baseURL stays as '/api' in all environments so the built React app
 * always calls relative URLs — Nginx routes them to Laravel on the server.
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
})

// Attach Sanctum token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
