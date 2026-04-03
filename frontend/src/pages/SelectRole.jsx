import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldCheck, UserCog } from 'lucide-react';
import './auth.css';

const RoleCard = ({ id, title, subtitle, icon, selected, onClick }) => (
  <button className={`role-card ${selected ? 'selected' : ''}`} onClick={() => onClick(id)}>
    <div className="role-icon">{icon}</div>
    <div className="role-info">
      <div className="role-title">{title}</div>
      <div className="role-desc">{subtitle}</div>
    </div>
    {selected ? <div style={{ color: 'var(--color-accent)', fontWeight: 700 }}>OK</div> : null}
  </button>
);

export default function SelectRole() {
  const navigate = useNavigate();
  const [role, setRole] = useState('');

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
            subtitle="Manage departments, users, and approvals"
            icon={<UserCog size={26} />}
            selected={role === 'college_admin'}
            onClick={setRole}
          />
          <RoleCard
            id="teacher"
            title="Teacher"
            subtitle="Run attendance sessions and manage students"
            icon={<ShieldCheck size={26} />}
            selected={role === 'teacher'}
            onClick={setRole}
          />
          <RoleCard
            id="student"
            title="Student"
            subtitle="Scan QR and view attendance records"
            icon={<GraduationCap size={26} />}
            selected={role === 'student'}
            onClick={setRole}
          />
        </div>

        <div className="auth-actions">
          <button className="btn-primary" disabled={!role} onClick={() => navigate(`/register/${role}`)}>
            Continue
          </button>

          <div className="auth-footer">
            <Link to="/login">Already have an account? Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
