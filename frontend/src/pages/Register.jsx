import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import './auth.css'

// Validation helpers (mirror backend)
const validateFullName = (name) => /^[A-Za-z\s]+$/.test(name);
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^\d{10}$/.test(phone);
const validatePassword = (password) => {
  if (password.length < 8) return false;
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  return hasDigit && hasSymbol;
};
const validateEnrollmentId = (id) => /^\d{2}[A-Z]{2}\d{3}$/.test(id);
const validateTeacherId = (id) => /^[A-Z]{2}\d{3}$/.test(id);

export default function Register() {
  const { role } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    department: '',
    enrollmentId: '',
    teacherId: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [collegesList, setCollegesList] = useState([])
  const [collegesLoading, setCollegesLoading] = useState(true)

  function onChange(e) {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    // Clear error on change
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  useEffect(() => {
    let mounted = true
    const fetchColleges = async () => {
      try {
        const res = await fetch('/api/colleges-public')
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to load colleges')
        if (mounted) setCollegesList(data)
      } catch (err) {
        console.error('Failed to fetch colleges:', err.message)
      } finally {
        if (mounted) setCollegesLoading(false)
      }
    }
    fetchColleges()
    return () => { mounted = false }
  }, [])

  function validateForm() {
    const newErrors = {}

    if (!validateFullName(form.fullName)) {
      newErrors.fullName = 'Name can only contain letters and spaces'
    }
    if (!validateEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (form.phone && !validatePhone(form.phone)) {
      newErrors.phone = 'Phone must be exactly 10 digits'
    }
    if (!validatePassword(form.password)) {
      newErrors.password = 'Min 8 chars, 1 digit, 1 symbol required'
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    // Role-specific validation
    if (role === 'student') {
      if (!validateEnrollmentId(form.enrollmentId)) {
        newErrors.enrollmentId = 'Format: 22CE093 (YY+Branch+Number)'
      }
      if (!form.department) {
        newErrors.department = 'Department is required'
      }
    }

    if (role === 'teacher') {
      if (!validateTeacherId(form.teacherId)) {
        newErrors.teacherId = 'Format: CE001 (Branch+Number)'
      }
      if (!form.department) {
        newErrors.department = 'Department is required'
      }
    }

    if (role === 'college_admin') {
      if (!form.college) {
        newErrors.college = 'College is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function onSubmit(e) {
    e.preventDefault()
    setServerError(null)

    if (!validateForm()) return

    setLoading(true)
    try {
      const body = {
        role,
        name: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        department: form.department || undefined,
        enrollmentId: role === 'student' ? form.enrollmentId : undefined,
        teacherId: role === 'teacher' ? form.teacherId : undefined,
        college: form.college || undefined,
        password: form.password
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Registration failed')

      // All roles except superadmin need approval
      setServerError('Registration successful! Please wait for approval before logging in.')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const roleTitle = role === 'college_admin' ? 'College Admin' : role ? role.charAt(0).toUpperCase() + role.slice(1) : ''

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Back to Role
        </button>

        <div className="auth-header" style={{ marginTop: '10px' }}>
          <div className="auth-logo">Create Account</div>
          <div className="auth-subtitle">{roleTitle} Registration</div>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              className={`form-input ${errors.fullName ? 'input-error' : ''}`}
              name="fullName"
              value={form.fullName}
              onChange={onChange}
              placeholder="John Doe"
              required
            />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="name@example.com"
              required
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              className={`form-input ${errors.phone ? 'input-error' : ''}`}
              name="phone"
              value={form.phone}
              onChange={(e) => {
                // Only allow digits
                const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                setForm({ ...form, phone: val })
              }}
              placeholder="1234567890"
              maxLength={10}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label>College Name</label>
            <select
              className={`form-input ${errors.college ? 'input-error' : ''}`}
              name="college"
              value={form.college}
              onChange={onChange}
              required
            >
              <option value="">{collegesLoading ? 'Loading colleges...' : 'Select College'}</option>
              {!collegesLoading && collegesList.length === 0 && (
                <option value="">No colleges available</option>
              )}
              {collegesList.map(c => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
            {errors.college && <span className="field-error">{errors.college}</span>}
          </div>

          {/* Department only for teacher and student */}
          {(role === 'teacher' || role === 'student') && (
            <div className="form-group">
              <label>Department</label>
              <select
                className={`form-input ${errors.department ? 'input-error' : ''}`}
                name="department"
                value={form.department}
                onChange={onChange}
                required
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
              </select>
              {errors.department && <span className="field-error">{errors.department}</span>}
            </div>
          )}

          {role === 'student' && (
            <div className="form-group">
              <label>Enrollment ID</label>
              <input
                className={`form-input ${errors.enrollmentId ? 'input-error' : ''}`}
                name="enrollmentId"
                value={form.enrollmentId}
                onChange={(e) => {
                  // Force uppercase
                  setForm({ ...form, enrollmentId: e.target.value.toUpperCase() })
                }}
                placeholder="22CE093"
                required
              />
              {errors.enrollmentId && <span className="field-error">{errors.enrollmentId}</span>}
            </div>
          )}

          {role === 'teacher' && (
            <div className="form-group">
              <label>Teacher ID</label>
              <input
                className={`form-input ${errors.teacherId ? 'input-error' : ''}`}
                name="teacherId"
                value={form.teacherId}
                onChange={(e) => {
                  // Force uppercase
                  setForm({ ...form, teacherId: e.target.value.toUpperCase() })
                }}
                placeholder="CE001"
                required
              />
              {errors.teacherId && <span className="field-error">{errors.teacherId}</span>}
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              placeholder="••••••••"
              required
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
            <small style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              Min 8 chars, 1 digit, 1 symbol
            </small>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={onChange}
              placeholder="••••••••"
              required
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          {serverError && <div className="error-msg">{serverError}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  )
}
