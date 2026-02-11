import React, { useState, useEffect } from 'react'
import { RequestCard, SectionHeader } from '../../components/DashboardWidgets'
import '../dashboard.css'

export default function AdminApprovals() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/approval-requests', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch approval requests')
      setRequests(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this request?`)) return
    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const endpoint = action === 'approve' ? `/api/admin/approve/${id}` : `/api/admin/reject/${id}`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Action failed')
      setRequests(prev => prev.filter(r => r._id !== id))
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <h1 className="page-title">Pending Approvals</h1>
        <p className="page-subtitle">Approve or reject pending teacher and student registrations</p>
      </div>

      <div className="content-card">
        {error && <div className="error-alert">{error}</div>}
        {loading ? (
          <div className="loading-spinner">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</span>
            <h3>No Pending Requests</h3>
            <p>All approval requests have been processed.</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(req => (
              <RequestCard
                key={req._id}
                user={req}
                onApprove={() => handleAction(req._id, 'approve')}
                onReject={() => handleAction(req._id, 'reject')}
                loading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
