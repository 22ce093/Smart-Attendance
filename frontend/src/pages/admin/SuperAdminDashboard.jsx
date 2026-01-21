import { useState, useEffect } from 'react'
import '../dashboard.css'

const StatCard = ({ label, value, icon, color }) => (
    <div className="stat-card">
        <div className="stat-info">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
        <div className={`stat-icon ${color}`}>{icon}</div>
    </div>
)

const RequestCard = ({ user, onApprove, onReject, loading }) => (
    <div className="request-card">
        <div className="request-info">
            <div className="request-name">{user.name}</div>
            <div className="request-email">{user.email}</div>
            <div className="request-meta">
                <span>📍 {user.college}</span>
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
)

export default function SuperAdminDashboard() {
    const [pendingAdmins, setPendingAdmins] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState(null)

    const token = localStorage.getItem('token')

    useEffect(() => {
        fetchPendingAdmins()
    }, [])

    const fetchPendingAdmins = async () => {
        try {
            const res = await fetch('/api/admin/pending-college-admins', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)
            setPendingAdmins(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id) => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/admin/approve-college-admin/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to approve')
            setPendingAdmins(prev => prev.filter(a => a._id !== id))
        } catch (err) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async (id) => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/admin/reject-college-admin/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to reject')
            setPendingAdmins(prev => prev.filter(a => a._id !== id))
        } catch (err) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Super Admin Dashboard</h1>
                <div className="page-subtitle">Manage all college administrators</div>
            </div>

            <div className="stats-grid">
                <StatCard label="Pending Approvals" value={pendingAdmins.length} icon="⏳" color="orange" />
                <StatCard label="Role" value="Super Admin" icon="👑" color="purple" />
            </div>

            <div className="section-header">
                <h2>Pending College Admin Requests</h2>
            </div>

            {loading && <div className="loading-msg">Loading...</div>}
            {error && <div className="error-msg">{error}</div>}

            {!loading && pendingAdmins.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <p>No pending college admin requests</p>
                </div>
            )}

            <div className="requests-list">
                {pendingAdmins.map(admin => (
                    <RequestCard
                        key={admin._id}
                        user={admin}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        loading={actionLoading}
                    />
                ))}
            </div>
        </div>
    )
}
