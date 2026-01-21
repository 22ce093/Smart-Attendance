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

const ProfileCard = ({ user }) => (
    <div className="profile-card">
        <div className="profile-avatar">🎓</div>
        <div className="profile-info">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            <div className="profile-meta">
                <span>🏫 {user.college}</span>
                <span>📚 {user.department}</span>
                <span>🆔 {user.enrollmentId}</span>
            </div>
        </div>
    </div>
)

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
            <div>
                <div className="page-header">
                    <h1 className="page-title">Student Dashboard</h1>
                </div>
                <div className="loading-msg">Loading...</div>
            </div>
        )
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Student Dashboard</h1>
                <div className="page-subtitle">Welcome back, {user?.name || 'Student'}!</div>
            </div>

            {user && <ProfileCard user={user} />}

            <div className="stats-grid">
                <StatCard label="Attendance Rate" value="92%" icon="📊" color="green" />
                <StatCard label="Classes Today" value="4" icon="📚" color="blue" />
                <StatCard label="Pending Check-ins" value="1" icon="⏰" color="orange" />
            </div>

            <div className="section-header">
                <h2>Today's Schedule</h2>
            </div>

            <div className="schedule-list">
                <div className="schedule-item">
                    <div className="schedule-time">09:00 AM</div>
                    <div className="schedule-details">
                        <div className="schedule-subject">Data Structures</div>
                        <div className="schedule-room">Room 301</div>
                    </div>
                    <div className="schedule-status checked">✓ Checked In</div>
                </div>
                <div className="schedule-item">
                    <div className="schedule-time">11:00 AM</div>
                    <div className="schedule-details">
                        <div className="schedule-subject">Database Systems</div>
                        <div className="schedule-room">Room 205</div>
                    </div>
                    <div className="schedule-status checked">✓ Checked In</div>
                </div>
                <div className="schedule-item">
                    <div className="schedule-time">02:00 PM</div>
                    <div className="schedule-details">
                        <div className="schedule-subject">Web Development</div>
                        <div className="schedule-room">Lab 102</div>
                    </div>
                    <div className="schedule-status pending">Pending</div>
                </div>
                <div className="schedule-item">
                    <div className="schedule-time">04:00 PM</div>
                    <div className="schedule-details">
                        <div className="schedule-subject">Machine Learning</div>
                        <div className="schedule-room">Room 401</div>
                    </div>
                    <div className="schedule-status upcoming">Upcoming</div>
                </div>
            </div>

            <div className="section-header" style={{ marginTop: '40px' }}>
                <h2>Recent Attendance</h2>
            </div>
            <div className="empty-state">
                <div className="empty-icon">📅</div>
                <p>Attendance history coming soon</p>
            </div>
        </div>
    )
}
