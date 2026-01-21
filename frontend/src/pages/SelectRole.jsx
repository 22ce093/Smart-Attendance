import { Link, useNavigate } from 'react-router-dom'
import './auth.css'
import { useState } from 'react'

const RoleCard = ({ id, title, subtitle, icon, selected, onClick }) => (
  <button
    className={`role-card ${selected ? 'selected' : ''}`}
    onClick={() => onClick(id)}
  >
    <div className="role-icon">{icon}</div>
    <div className="role-info">
      <div className="role-title">{title}</div>
      <div className="role-desc">{subtitle}</div>
    </div>
    {selected && <div style={{ color: 'var(--color-accent)' }}>●</div>}
  </button>
)

export default function SelectRole() {
  const navigate = useNavigate()
  const [role, setRole] = useState('')

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">SCAN2ATTENDANCE</div>
          <div className="auth-subtitle">Select your role to continue</div>
        </div>

        <div className="role-grid">
          <RoleCard
            id="college_admin"
            title="College Admin"
            subtitle="Manage your college & teachers"
            icon="🛡️"
            selected={role === 'college_admin'}
            onClick={setRole}
          />
          <RoleCard
            id="teacher"
            title="Teacher"
            subtitle="Manage classes & attendance"
            icon="👨‍🏫"
            selected={role === 'teacher'}
            onClick={setRole}
          />
          <RoleCard
            id="student"
            title="Student"
            subtitle="Check-in & view history"
            icon="🎓"
            selected={role === 'student'}
            onClick={setRole}
          />
        </div>

        <div className="auth-actions">
          <button
            className="btn-primary"
            disabled={!role}
            onClick={() => navigate(`/register/${role}`)}
          >
            Continue
          </button>

          <div className="auth-footer">
            <Link to="/login">Already have an account? Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

