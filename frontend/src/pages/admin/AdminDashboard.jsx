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
                <span>🏫 {user.college}</span>
                <span>📚 {user.department}</span>
                <span>🆔 {user.teacherId}</span>
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

export default function CollegeAdminDashboard() {
    const [pendingTeachers, setPendingTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState(null)
    const [userCollege, setUserCollege] = useState('')

    const token = localStorage.getItem('token')

    useEffect(() => {
        // Get college from stored user info or decode token
        const storedCollege = localStorage.getItem('college')
        if (storedCollege) setUserCollege(storedCollege)
        fetchPendingTeachers()
    }, [])

    const fetchPendingTeachers = async () => {
        try {
            const res = await fetch('/api/admin/pending-teachers', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)
            setPendingTeachers(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id) => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/admin/approve/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to approve')
            setPendingTeachers(prev => prev.filter(t => t._id !== id))
        } catch (err) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async (id) => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/admin/reject/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to reject')
            setPendingTeachers(prev => prev.filter(t => t._id !== id))
        } catch (err) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">College Admin Dashboard</h1>
                <div className="page-subtitle">
                    Managing teachers for {userCollege || 'your college'}
                </div>
            </div>

            <div className="stats-grid">
                <StatCard label="Pending Teachers" value={pendingTeachers.length} icon="⏳" color="orange" />
                <StatCard label="Your College" value={userCollege || '-'} icon="🏫" color="blue" />
            </div>

            <div className="section-header">
                <h2>Pending Teacher Requests</h2>
            </div>

            {loading && <div className="loading-msg">Loading...</div>}
            {error && <div className="error-msg">{error}</div>}

            {!loading && pendingTeachers.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <p>No pending teacher requests for your college</p>
                </div>
            )}

            <div className="requests-list">
                {pendingTeachers.map(teacher => (
                    <RequestCard
                        key={teacher._id}
                        user={teacher}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        loading={actionLoading}
                    />
                ))}
            </div>
        </div>
    )
}
