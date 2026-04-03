import { BadgeCheck, Building2, Check, GraduationCap, Mail, UserSquare2, X } from 'lucide-react';
import '../pages/dashboard.css';

export const StatCard = ({ label, value, icon, color }) => (
  <div className="stat-card">
    <div className="stat-info">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
    <div className={`stat-icon ${color}`}>{icon}</div>
  </div>
);

export const RequestCard = ({ user, onApprove, onReject, loading }) => (
  <div className="request-card">
    <div className="request-info">
      <div className="request-name">{user.name}</div>
      <div className="request-email">
        <Mail size={14} />
        <span>{user.email}</span>
      </div>
      <div className="request-meta">
        {user.college ? (
          <span>
            <Building2 size={14} />
            {user.college}
          </span>
        ) : null}
        {user.department ? (
          <span>
            <GraduationCap size={14} />
            {user.department}
          </span>
        ) : null}
        {user.enrollmentId ? (
          <span>
            <BadgeCheck size={14} />
            {user.enrollmentId}
          </span>
        ) : null}
        {user.teacherId ? (
          <span>
            <UserSquare2 size={14} />
            {user.teacherId}
          </span>
        ) : null}
      </div>
    </div>
    <div className="request-actions">
      <button className="btn-approve" onClick={() => onApprove(user._id)} disabled={loading}>
        <Check size={16} />
        Approve
      </button>
      <button className="btn-reject" onClick={() => onReject(user._id)} disabled={loading}>
        <X size={16} />
        Reject
      </button>
    </div>
  </div>
);

export const SectionHeader = ({ title, action }) => (
  <div className="section-header">
    <h2>{title}</h2>
    {action}
  </div>
);
