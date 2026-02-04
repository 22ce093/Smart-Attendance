import { useState, useEffect } from 'react'
import { StatCard, RequestCard, SectionHeader } from '../../components/DashboardWidgets'
import { Users, Clock, QrCode, BookOpen, BarChart3 } from 'lucide-react'
import '../dashboard.css'

export default function CollegeAdminDashboard() {
    const [pendingTeachers, setPendingTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState(null)
    const [userCollege, setUserCollege] = useState('')

    const token = localStorage.getItem('token')

    useEffect(() => {
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
                <h1 className="page-title">Dashboard</h1>
                <div className="page-subtitle">
                    Overview for {userCollege || 'Your College'}
                </div>
            </div>

            <div className="stats-grid">
                <StatCard
                    label="Today's Classes"
                    value="2"
                    icon={<BookOpen size={24} />}
                    color="blue"
                />
                <StatCard
                    label="Active QR Session"
                    value="Active"
                    icon={<QrCode size={24} />}
                    color="green"
                />
                <StatCard
                    label="Pending Approvals"
                    value={pendingTeachers.length}
                    icon={<Clock size={24} />}
                    color="orange"
                />
                <StatCard
                    label="Avg Attendance"
                    value="86%"
                    icon={<BarChart3 size={24} />}
                    color="purple"
                />
            </div>

            <div className="dashboard-grid-2col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div className="main-section">
                    <SectionHeader title="Teacher Approvals" />

                    {loading && <div className="loading-msg">Loading requests...</div>}
                    {error && <div className="error-msg">{error}</div>}

                    {!loading && pendingTeachers.length === 0 && (
                        <div className="empty-state">
                            <div className="empty-icon">✅</div>
                            <p>No pending teacher requests</p>
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

                <div className="side-section">
                    <SectionHeader title="Today's Classes" />
                    <div className="schedule-list">
                        <div className="schedule-item">
                            <div className="schedule-time">09:00 AM</div>
                            <div className="schedule-details">
                                <div className="schedule-subject">Data Structures</div>
                                <div className="schedule-room">CS Dept • Room 301</div>
                            </div>
                        </div>
                        <div className="schedule-item">
                            <div className="schedule-time">01:30 PM</div>
                            <div className="schedule-details">
                                <div className="schedule-subject">Database Mgmt</div>
                                <div className="schedule-room">CS Dept • Lab 2</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '32px' }}>
                        <SectionHeader title="Department Attendance" />
                        <div className="stat-card" style={{ display: 'block' }}>
                            {/* Placeholder for chart */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Computer Science</span>
                                <span style={{ color: '#22c55e' }}>92%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '92%', height: '100%', background: '#22c55e' }}></div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', marginTop: '16px' }}>
                                <span>Mechanical</span>
                                <span style={{ color: '#38bdf8' }}>78%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '78%', height: '100%', background: '#38bdf8' }}></div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', marginTop: '16px' }}>
                                <span>Civil</span>
                                <span style={{ color: '#f97316' }}>64%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '64%', height: '100%', background: '#f97316' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
