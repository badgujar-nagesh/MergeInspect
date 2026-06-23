import axios from 'axios'

/**
 * VITE_API_BASE_URL is baked into the JS bundle at build time by Vite.
 * - .env.development  → http://localhost:8000   (used by npm run dev)
 * - .env.production   → https://yourdomain.com  (used by npm run build)
 *
 * The baseURL here is used directly by axios in the browser.
 * The Vite proxy in vite.config.js is NOT used in production builds —
 * only during local dev as a fallback if VITE_API_BASE_URL is not set.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: BASE_URL,
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
