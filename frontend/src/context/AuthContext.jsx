import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password })
    setUser(res.data.user)
    setToken(res.data.token)
    localStorage.setItem('user',  JSON.stringify(res.data.user))
    localStorage.setItem('token', res.data.token)
    return res.data
  }

  const register = async (name, email, password, password_confirmation) => {
    const res = await api.post('/register', { name, email, password, password_confirmation })
    setUser(res.data.user)
    setToken(res.data.token)
    localStorage.setItem('user',  JSON.stringify(res.data.user))
    localStorage.setItem('token', res.data.token)
    return res.data
  }

  const logout = async () => {
    try { await api.post('/logout') } catch (_) {}
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
