import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login         from './pages/Login'
import Register      from './pages/Register'
import Dashboard     from './pages/Dashboard'
import NewReview     from './pages/NewReview'
import ReviewDetail  from './pages/ReviewDetail'
import ReviewHistory from './pages/ReviewHistory'
import Settings      from './pages/Settings'
import Layout        from './components/Layout'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index                    element={<Dashboard />} />
            <Route path="reviews/new"       element={<NewReview />} />
            <Route path="reviews"           element={<ReviewHistory />} />
            <Route path="reviews/:id"       element={<ReviewDetail />} />
            <Route path="settings"          element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
