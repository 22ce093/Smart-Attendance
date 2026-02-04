import React from 'react';
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
            <div className="request-email">{user.email}</div>
            <div className="request-meta">
                {user.college && <span>🏫 {user.college}</span>}
                {user.department && <span>📚 {user.department}</span>}
                {user.enrollmentId && <span>🆔 {user.enrollmentId}</span>}
                {user.teacherId && <span>🆔 {user.teacherId}</span>}
            </div>
        </div>
        <div className="request-actions">
            <button
                className="btn-approve"
                onClick={() => onApprove(user._id)}
                disabled={loading}
            >
                ✓ Approve
            </button>
            <button
                className="btn-reject"
                onClick={() => onReject(user._id)}
                disabled={loading}
            >
                ✗ Reject
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
