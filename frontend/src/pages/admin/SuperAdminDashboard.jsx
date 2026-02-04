import { useState, useEffect } from 'react'
import { StatCard, RequestCard, SectionHeader } from '../../components/DashboardWidgets'
import { Crown, Building2, Users, CalendarCheck, Clock } from 'lucide-react'

export default function SuperAdminDashboard() {
    const [pendingAdmins, setPendingAdmins] = useState([])
    const [stats, setStats] = useState({
        totalColleges: 0,
        activeStudents: 0,
        totalTeachers: 0,
        attendanceSessions: 0
    })
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState(null)

    const token = localStorage.getItem('token')

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([fetchPendingAdmins(), fetchStats(), fetchRecentActivity()])
            setLoading(false)
        }
        fetchData()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/dashboard-stats', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) {
                setStats(data)
            }
        } catch (err) {
            console.error(err)
        }
    }

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
        }
    }

    const fetchRecentActivity = async () => {
        try {
            const [collegesRes, pendingsRes] = await Promise.all([
                fetch('/api/admin/colleges', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/admin/pending-college-admins', { headers: { Authorization: `Bearer ${token}` } })
            ])

            const colleges = collegesRes.ok ? await collegesRes.json() : []
            const pendings = pendingsRes.ok ? await pendingsRes.json() : []

            const activities = []

            // Recent college registrations
            (colleges || []).slice(0, 5).forEach(c => {
                activities.push({
                    id: `college-${c._id}`,
                    text: `New college "${c.name}" registered`,
                    time: new Date(c.createdAt).toLocaleString(),
                    date: c.createdAt,
                    type: 'college'
                })
            })

            // Pending college admin requests
            (pendings || []).forEach(p => {
                activities.push({
                    id: `pending-${p._id}`,
                    text: `College Admin request from "${p.name || p.email}" pending`,
                    time: new Date(p.createdAt).toLocaleString(),
                    date: p.createdAt,
                    type: 'request'
                })
            })

            // Sort by date desc and keep top 5
            activities.sort((a, b) => new Date(b.date) - new Date(a.date))
            setRecentActivity(activities.slice(0, 5))
        } catch (err) {
            console.error(err)
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

    const [recentActivity, setRecentActivity] = useState([])

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">Super Admin Dashboard</h1>
                <div className="page-subtitle">Overview of system health and administrative actions</div>
            </div>

            <div className="stats-grid">
                <StatCard
                    label="Total Colleges"
                    value={stats.totalColleges}
                    icon={<Building2 size={24} />}
                    color="purple"
                />
                <StatCard
                    label="Active Students"
                    value={stats.activeStudents}
                    icon={<Users size={24} />}
                    color="blue"
                />
                <StatCard
                    label="Total Teachers"
                    value={stats.totalTeachers}
                    icon={<Crown size={24} />}
                    color="green"
                />
                <StatCard
                    label="Pending Approvals"
                    value={pendingAdmins.length}
                    icon={<Clock size={24} />}
                    color="orange"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Quick Actions / Alerts */}
                <div className="content-card">
                    <SectionHeader title="Quick Alerts" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {pendingAdmins.length > 0 ? (
                            <div style={{
                                padding: '16px',
                                background: 'rgba(249, 115, 22, 0.1)',
                                border: '1px solid rgba(249, 115, 22, 0.3)',
                                borderRadius: '12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h4 style={{ color: '#f97316', margin: '0 0 4px 0' }}>{pendingAdmins.length} Pending Requests</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>College admins waiting for approval</p>
                                </div>
                                <a href="/superadmin/approvals" className="btn-secondary" style={{ marginTop: 0, textDecoration: 'none', fontSize: '0.9rem' }}>Review</a>
                            </div>
                        ) : (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                All clear! No pending actions.
                            </div>
                        )}

                        <div style={{
                            padding: '16px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '12px'
                        }}>
                            <h4 style={{ color: '#3b82f6', margin: '0 0 4px 0' }}>System Status: Healthy</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0 }}>All services are running normally</p>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="content-card">
                    <SectionHeader title="Recent Activity" />
                    <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recentActivity.map(activity => (
                            <div key={activity.id} style={{
                                padding: '12px',
                                borderBottom: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>{activity.text}</p>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{activity.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
