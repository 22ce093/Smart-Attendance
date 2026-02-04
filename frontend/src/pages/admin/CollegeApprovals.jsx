import { useState, useEffect } from 'react'
import '../dashboard.css'

export default function CollegeApprovals() {
    const [pendingAdmins, setPendingAdmins] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [actionLoading, setActionLoading] = useState(null)

    useEffect(() => {
        fetchPendingAdmins()
    }, [])

    const fetchPendingAdmins = async () => {
        setLoading(true)
        setError(null)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/pending-college-admins', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed to fetch pending admins')
            setPendingAdmins(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return

        setActionLoading(id)
        try {
            const token = localStorage.getItem('token')
            // action is 'approve' or 'reject'
            const endpoint = action === 'approve'
                ? `/api/admin/approve-college-admin/${id}`
                : `/api/admin/reject-college-admin/${id}`

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Action failed')

            // Remove from list
            setPendingAdmins(prev => prev.filter(admin => admin._id !== id))
            alert(`College Admin ${action}d successfully`)
        } catch (err) {
            alert(err.message)
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1 className="page-title">College Admin Approvals</h1>
                <p className="page-subtitle">Review and approve registration requests from new colleges</p>
            </div>

            <div className="content-card">
                {error && <div className="error-alert">{error}</div>}

                {loading ? (
                    <div className="loading-spinner">Loading request details...</div>
                ) : pendingAdmins.length === 0 ? (
                    <div className="empty-state">
                        <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</span>
                        <h3>No Pending Requests</h3>
                        <p>All college admin registrations have been processed.</p>
                        <button onClick={fetchPendingAdmins} className="btn-secondary">Refresh</button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Admin Name</th>
                                    <th>Email</th>
                                    <th>College / Organization</th>
                                    <th>Phone</th>
                                    <th>Registered Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingAdmins.map(admin => (
                                    <tr key={admin._id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{admin.name}</div>
                                        </td>
                                        <td>{admin.email}</td>
                                        <td>
                                            <span className="badge-blue">
                                                {admin.college || 'N/A'}
                                            </span>
                                        </td>
                                        <td>{admin.phone || '-'}</td>
                                        <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => handleAction(admin._id, 'approve')}
                                                    disabled={actionLoading === admin._id}
                                                    className="btn-approve"
                                                >
                                                    {actionLoading === admin._id ? '...' : 'Approve'}
                                                </button>
                                                <button
                                                    onClick={() => handleAction(admin._id, 'reject')}
                                                    disabled={actionLoading === admin._id}
                                                    className="btn-reject"
                                                >
                                                    {actionLoading === admin._id ? '...' : 'Reject'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
