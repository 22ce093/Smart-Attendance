import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './auth.css'
import { clearStoredAuth, getHomeRouteForRole } from '../auth'

const ROLE_PREFIX = {
  superadmin: '/superadmin',
  college_admin: '/admin',
  teacher: '/teacher',
  student: '/student'
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Login failed')
      }
      if (data.token) {
        clearStoredAuth()
        localStorage.setItem('token', data.token)
        localStorage.setItem('role', data.role)
        localStorage.setItem('name', data.name)
        localStorage.setItem('userId', data._id)
        if (data.college) localStorage.setItem('college', data.college)
        if (data.department) localStorage.setItem('department', data.department)
      }

      const requestedRoute = location.state?.from?.pathname
      const defaultRoute = getHomeRouteForRole(data.role)
      const allowedPrefix = ROLE_PREFIX[data.role]
      const targetRoute =
        requestedRoute && requestedRoute.startsWith(allowedPrefix)
          ? requestedRoute
          : defaultRoute

      navigate(targetRoute, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">Welcome Back</div>
          <div className="auth-subtitle">Login to your account</div>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              className="form-input"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className="form-input"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              placeholder="********"
              required
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/register/student">Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  )
}
