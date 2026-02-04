import { useState, useEffect } from 'react'
import '../dashboard.css'

export default function ManageUsers() {
    const [users, setUsers] = useState([])
    const [filteredUsers, setFilteredUsers] = useState([])
    const [activeTab, setActiveTab] = useState('student')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [actionLoading, setActionLoading] = useState(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    useEffect(() => {
        filterUsers()
    }, [users, activeTab])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/all-users', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed to fetch users')
            setUsers(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const filterUsers = () => {
        const filtered = users.filter(user => user.role === activeTab)
        setFilteredUsers(filtered)
    }

    const handleToggleStatus = async (user) => {
        const newStatus = user.status === 'BLOCKED' ? 'Unblock' : 'Block'
        if (!window.confirm(`Are you sure you want to ${newStatus} ${user.name}?`)) return

        setActionLoading(user._id)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/admin/toggle-status/${user._id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)

            // Update local state
            setUsers(users.map(u =>
                u._id === user._id ? { ...u, status: data.status } : u
            ))

            alert(`User ${newStatus}ed successfully`)
        } catch (err) {
            alert(err.message)
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1 className="page-title">Manage Users</h1>
                <p className="page-subtitle">Control system access for all users</p>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    {['student', 'teacher', 'college_admin'].map(role => (
                        <button
                            key={role}
                            onClick={() => setActiveTab(role)}
                            className={activeTab === role ? 'btn-primary' : 'btn-secondary'}
                            style={{
                                textTransform: 'capitalize',
                                background: activeTab === role ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
                                marginTop: 0
                            }}
                        >
                            {role.replace('_', ' ')}s
                        </button>
                    ))}
                </div>
            </div>

            <div className="content-card">
                {loading ? (
                    <div className="loading-spinner">Loading users...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>College</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                                            No {activeTab}s found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user._id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{user.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                                    {user.enrollmentId || user.teacherId || '-'}
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{user.college || 'N/A'}</td>
                                            <td>
                                                <span className={`status-badge ${user.status === 'APPROVED' ? 'active' : 'inactive'}`}
                                                    style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.8rem',
                                                        background: user.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                        color: user.status === 'APPROVED' ? '#22c55e' : '#ef4444'
                                                    }}
                                                >
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    disabled={actionLoading === user._id}
                                                    className="btn-secondary"
                                                    style={{
                                                        marginTop: 0,
                                                        fontSize: '0.8rem',
                                                        border: '1px solid ' + (user.status === 'BLOCKED' ? '#22c55e' : '#ef4444'),
                                                        color: user.status === 'BLOCKED' ? '#22c55e' : '#ef4444'
                                                    }}
                                                >
                                                    {user.status === 'BLOCKED' ? 'Activate' : 'Deactivate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
