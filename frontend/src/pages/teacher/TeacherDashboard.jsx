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
                <span>🆔 {user.enrollmentId}</span>
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

export default function TeacherDashboard() {
    const [pendingStudents, setPendingStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState(null)

    const token = localStorage.getItem('token')
    const userName = localStorage.getItem('name') || 'Teacher'

    useEffect(() => {
        fetchPendingStudents()
    }, [])

    const fetchPendingStudents = async () => {
        try {
            const res = await fetch('/api/teacher/pending', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)
            setPendingStudents(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (id) => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/teacher/approve/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to approve')
            setPendingStudents(prev => prev.filter(s => s._id !== id))
        } catch (err) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async (id) => {
        setActionLoading(true)
        try {
            const res = await fetch(`/api/teacher/reject/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Failed to reject')
            setPendingStudents(prev => prev.filter(s => s._id !== id))
        } catch (err) {
            setError(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Teacher Dashboard</h1>
                <div className="page-subtitle">Welcome, {userName}</div>
            </div>

            <div className="stats-grid">
                <StatCard label="Pending Students" value={pendingStudents.length} icon="⏳" color="orange" />
                <StatCard label="Classes Today" value="3" icon="📚" color="blue" />
                <StatCard label="Total Students" value="42" icon="🎓" color="green" />
            </div>

            <div className="section-header">
                <h2>Pending Student Requests</h2>
            </div>

            {loading && <div className="loading-msg">Loading...</div>}
            {error && <div className="error-msg">{error}</div>}

            {!loading && pendingStudents.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <p>No pending student requests</p>
                </div>
            )}

            <div className="requests-list">
                {pendingStudents.map(student => (
                    <RequestCard
                        key={student._id}
                        user={student}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        loading={actionLoading}
                    />
                ))}
            </div>

            {/* Future: Classes section */}
            <div className="section-header" style={{ marginTop: '40px' }}>
                <h2>Your Classes</h2>
            </div>
            <div className="empty-state">
                <div className="empty-icon">📚</div>
                <p>Class management coming soon</p>
            </div>
        </div>
    )
}
