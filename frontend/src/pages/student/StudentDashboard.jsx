import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { StatCard, SectionHeader } from '../../components/DashboardWidgets'
import { BarChart3, BookOpen, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'

export default function StudentDashboard() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const token = localStorage.getItem('token')

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)
            setUser(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-gradient)', color: 'white' }}>
                Loading...
            </div>
        )
    }

    // Check approval status (assuming 'isApproved' or similar flag, otherwise infer from status)
    // If specific flag isn't in 'user', we might need to rely on what backend sends. 
    // For now assuming 'status' field exists or defaulting to approved if not present.
    const isPending = user?.status === 'pending';

    return (
        <DashboardLayout role="student" userName={user?.name || 'Student'}>
            <div className="page-header">
                <h1 className="page-title">student Dashboard</h1>
                <div className="page-subtitle">Welcome back, {user?.name}!</div>
            </div>

            <div className="stats-grid">
                <StatCard
                    label="Attendance Rate"
                    value="82%"
                    icon={<BarChart3 size={24} />}
                    color="green"
                />
                <StatCard
                    label="Today's Classes"
                    value="2"
                    icon={<BookOpen size={24} />}
                    color="blue"
                />
                <StatCard
                    label="QR Scan Pending"
                    value="Pending"
                    icon={<Clock size={24} />}
                    color="orange"
                />
                <StatCard
                    label="Last Attended"
                    value="20 Apr"
                    icon={<Calendar size={24} />}
                    color="purple"
                />
            </div>

            {/* Pending Approval Banner */}
            {isPending && (
                <div style={{
                    padding: '24px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '16px',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '16px'
                }}>
                    <div style={{
                        background: '#38bdf8',
                        color: 'white',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex'
                    }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--color-text-primary)' }}>Pending College Admin Approval</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Your account is currently waiting for approval from your college administrator.
                            You will be notified once your registration is confirmed.
                        </p>
                    </div>
                </div>
            )}

            <div className="dashboard-grid-2col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '24px' }}>

                {/* Attendance Overview / History */}
                <div className="main-section">
                    <SectionHeader title="Attendance Overview" />

                    <div className="table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '16px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Course</th>
                                    <th style={{ padding: '16px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Department</th>
                                    <th style={{ padding: '16px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '16px', color: 'var(--color-text-primary)' }}>Data Structures</td>
                                    <td style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>Computer Science</td>
                                    <td style={{ padding: '16px', color: '#22c55e' }}>36%</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '16px', color: 'var(--color-text-primary)' }}>Quantum Systems</td>
                                    <td style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>Physics</td>
                                    <td style={{ padding: '16px', color: '#22c55e' }}>37%</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '16px', color: 'var(--color-text-primary)' }}>Database Management</td>
                                    <td style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>Computer Science</td>
                                    <td style={{ padding: '16px', color: '#22c55e' }}>80%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Today's Schedule */}
                <div className="side-section">
                    <SectionHeader title="Today's Classes" />
                    <div className="schedule-list">
                        <div className="schedule-item">
                            <div className="schedule-time">09:00 AM</div>
                            <div className="schedule-details">
                                <div className="schedule-subject">Data Structures</div>
                                <div className="schedule-room">Room 301</div>
                            </div>
                            <div className="schedule-status checked">
                                <CheckCircle2 size={16} />
                            </div>
                        </div>
                        <div className="schedule-item">
                            <div className="schedule-time">11:00 AM</div>
                            <div className="schedule-details">
                                <div className="schedule-subject">Database Systems</div>
                                <div className="schedule-room">Room 205</div>
                            </div>
                            <div className="schedule-status checked">
                                <CheckCircle2 size={16} />
                            </div>
                        </div>
                        <div className="schedule-item">
                            <div className="schedule-time">02:00 PM</div>
                            <div className="schedule-details">
                                <div className="schedule-subject">Web Dev</div>
                                <div className="schedule-room">Lab 102</div>
                            </div>
                            <div className="schedule-status pending">
                                <Clock size={16} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
