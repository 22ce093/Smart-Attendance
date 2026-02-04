import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { StatCard, RequestCard, SectionHeader } from '../../components/DashboardWidgets'
import { BookOpen, QrCode, UserCheck, BarChart3, AlertTriangle } from 'lucide-react'

export default function TeacherDashboard() {
    const [pendingStudents, setPendingStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState(null)

    const token = localStorage.getItem('token')
    const userName = localStorage.getItem('name') || 'Teacher'

    const [stats, setStats] = useState({
        pendingApprovals: 0,
        todaysClasses: 0,
        activeSession: 'None',
        avgAttendance: '0%'
    });

    useEffect(() => {
        fetchDashboardStats();
        fetchPendingStudents();
    }, [])

    const fetchDashboardStats = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/teacher/dashboard-stats', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setStats(data)
        } catch (err) {
            console.error("Failed to fetch stats", err)
        }
    }

    const fetchPendingStudents = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/teacher/pending', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)
            setPendingStudents(data)
        } catch (err) {
            console.error(err) // Supress visible error for pending students if stats load ok
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
        <DashboardLayout role="teacher" userName={userName}>
            <div className="page-header">
                <h1 className="page-title">Teacher Dashboard</h1>
                <div className="page-subtitle">Manage your classes and students</div>
            </div>

            <div className="stats-grid">
                <StatCard
                    label="Today's Classes"
                    value={stats.todaysClasses}
                    icon={<BookOpen size={24} />}
                    color="blue"
                />
                <StatCard
                    label="Active QR Session"
                    value={stats.activeSession}
                    icon={<QrCode size={24} />}
                    color="purple"
                />
                <StatCard
                    label="Pending Approvals"
                    value={stats.pendingApprovals}
                    icon={<UserCheck size={24} />}
                    color="orange"
                />
                <StatCard
                    label="Avg Attendance"
                    value={stats.avgAttendance}
                    icon={<BarChart3 size={24} />}
                    color="green"
                />
            </div>

            <div className="dashboard-grid-2col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Left Column */}
                <div className="main-section">
                    <SectionHeader title="Pending Student Approvals" />

                    {loading && <div className="loading-msg">Loading requests...</div>}
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
                </div>

                {/* Right Column */}
                <div className="side-section">
                    <SectionHeader title="Today's Classes" />
                    <div className="schedule-list">
                        <div className="schedule-item">
                            <div className="schedule-time">10:00 AM</div>
                            <div className="schedule-details">
                                <div className="schedule-subject">Data Structures</div>
                                <div className="schedule-room">34 Students</div>
                            </div>
                        </div>
                        <div className="schedule-item">
                            <div className="schedule-time">01:30 PM</div>
                            <div className="schedule-details">
                                <div className="schedule-subject">Database Mgmt</div>
                                <div className="schedule-room">28 Students</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '32px' }}>
                        <SectionHeader title="Low Attendance Alerts" />
                        <div className="requests-list">
                            <div className="request-card" style={{ padding: '16px' }}>
                                <div className="request-info">
                                    <div className="request-name" style={{ fontSize: '0.95rem' }}>Rahul Sharma</div>
                                    <div className="request-email" style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                                        <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        Below 75% (68%)
                                    </div>
                                </div>
                                <button className="btn-approve" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', border: 'none' }}>
                                    Message
                                </button>
                            </div>
                            <div className="request-card" style={{ padding: '16px' }}>
                                <div className="request-info">
                                    <div className="request-name" style={{ fontSize: '0.95rem' }}>Priya Patel</div>
                                    <div className="request-email" style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                                        <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        Below 75% (72%)
                                    </div>
                                </div>
                                <button className="btn-approve" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', border: 'none' }}>
                                    Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
