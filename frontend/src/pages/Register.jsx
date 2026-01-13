import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import './auth.css'

export default function Register() {
  const { role } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const body = {
        role,
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        department: form.department,
        password: form.password
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Registration failed')
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container mobile-card">
      <div className="mobile-top">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <h2>{role ? `${role.charAt(0).toUpperCase() + role.slice(1)} Register` : 'Register'}</h2>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        <label>Full Name</label>
        <input name="fullName" value={form.fullName} onChange={onChange} placeholder="Full Name" required />

        <label>Email Address</label>
        <input name="email" type="email" value={form.email} onChange={onChange} placeholder="Email Address" required />

        <label>Phone Number</label>
        <input name="phone" value={form.phone} onChange={onChange} placeholder="Phone Number" />

        {role === 'teacher' && (
          <>
            <label>Department</label>
            <input name="department" value={form.department} onChange={onChange} placeholder="Department" />
          </>
        )}

        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={onChange} placeholder="Password" required />

        <label>Confirm Password</label>
        <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} placeholder="Confirm Password" required />

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="primary" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
      </form>

      <div className="auth-footer small">
        <Link to="/login">Already have an account? Login</Link>
      </div>
    </div>
  )
}
