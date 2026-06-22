import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    // Clear field error on change
    if (errors[key]) setErrors(e => { const n = { ...e }; delete n[key]; return n })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Client-side password match check
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: ['Passwords do not match.'] })
      setLoading(false)
      return
    }

    try {
      await register(form.name, form.email, form.password, form.password_confirmation)
      navigate('/')
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      } else {
        setErrors({ general: err.response?.data?.message ?? 'Registration failed. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (key) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
      errors[key] ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-3xl font-bold text-white">GitReview AI</h1>
          <p className="text-gray-400 mt-1 text-sm">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sign up</h2>

          {/* General error */}
          {errors.general && (
            <div className="mb-5 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={set('name')}
                placeholder="John Doe"
                className={inputCls('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name[0]}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                className={inputCls('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email[0]}
                  {errors.email[0]?.toLowerCase().includes('already registered') && (
                    <> <Link to="/login" className="underline font-semibold">Sign in instead?</Link></>
                  )}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 8 characters"
                className={inputCls('password')}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password[0]}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={form.password_confirmation}
                onChange={set('password_confirmation')}
                placeholder="Repeat your password"
                className={inputCls('password_confirmation')}
              />
              {errors.password_confirmation && (
                <p className="mt-1 text-xs text-red-600">{errors.password_confirmation[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          No email verification required — you're in immediately.
        </p>
      </div>
    </div>
  )
}
