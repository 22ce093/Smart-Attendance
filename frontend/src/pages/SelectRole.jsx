import { Link, useNavigate } from 'react-router-dom'
import './auth.css'
import { useState } from 'react'

const RoleRow = ({ id, title, subtitle, icon, selected, onClick }) => (
  <button className={"role-item" + (selected ? ' selected' : '')} onClick={() => onClick(id)}>
    <div className="role-left">
      <div className="role-icon">{icon}</div>
      <div className="role-text">
        <div className="role-title">{title}</div>
        <div className="role-sub">{subtitle}</div>
      </div>
    </div>
    <div className="role-arrow">›</div>
  </button>
)

export default function SelectRole() {
  const navigate = useNavigate()
  const [role, setRole] = useState('')

  return (
    <div className="auth-container mobile-card">
      <div className="mobile-top">
        <h2>Select Role</h2>
      </div>

      <div className="role-list">
        <RoleRow id="admin" title="Admin" subtitle="Full access" icon={"🧑‍💼"} selected={role==='admin'} onClick={setRole} />
        <RoleRow id="teacher" title="Teacher" subtitle="View & manage classes" icon={"🧑‍🏫"} selected={role==='teacher'} onClick={setRole} />
        <RoleRow id="student" title="Student" subtitle="Check-in & attendance" icon={"🎓"} selected={role==='student'} onClick={setRole} />
      </div>

      <div className="auth-actions">
        <button className="primary" disabled={!role} onClick={() => navigate(`/register/${role}`)}>Continue</button>
      </div>

      <div className="auth-footer small">
        <Link to="/login" className="login-link">Have an account? Login</Link>
      </div>
    </div>
  )
}
