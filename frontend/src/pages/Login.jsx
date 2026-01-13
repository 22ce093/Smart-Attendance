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
      if (!res.ok) throw new Error(data.message || 'Login failed')
      if (data.token) localStorage.setItem('token', data.token)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container mobile-card">
      <div className="mobile-top">
        <h2>Login</h2>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        <label>Email Address</label>
        <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Email" required />

        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={onChange} placeholder="Password" required />

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="primary" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>

      <div className="auth-footer small">
        <Link to="/register/student">Don't have an account? Register</Link>
      </div>
    </div>
  )
}
