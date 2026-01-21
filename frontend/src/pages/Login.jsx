import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './auth.css'

export default function Login() {
  const navigate = useNavigate()
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
        localStorage.setItem('token', data.token)
        localStorage.setItem('role', data.role)
        localStorage.setItem('name', data.name)
        if (data.college) localStorage.setItem('college', data.college)
      }

      // Role-based redirect
      switch (data.role) {
        case 'superadmin':
          navigate('/superadmin/dashboard')
          break
        case 'college_admin':
          navigate('/admin/dashboard')
          break
        case 'teacher':
          navigate('/teacher/dashboard')
          break
        case 'student':
          navigate('/student/dashboard')
          break
        default:
          navigate('/')
      }
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
              placeholder="••••••••"
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
