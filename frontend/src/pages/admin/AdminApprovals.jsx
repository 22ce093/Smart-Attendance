import { useEffect, useState } from 'react';
import { RequestCard, SectionHeader } from '../../components/DashboardWidgets';

export default function AdminApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/approval-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch approval requests');
      setRequests(data);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to fetch approval requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId, action) => {
    setActionLoading(requestId);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'approve' ? `/api/admin/approve/${requestId}` : `/api/admin/reject/${requestId}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Action failed');

      setRequests((current) => current.filter((request) => request._id !== requestId));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <h1 className="page-title">Pending Approvals</h1>
        <div className="page-subtitle">Approve or reject teacher and student registrations from your college.</div>
      </div>

      <div className="content-card">
        <SectionHeader title="Approval Queue" />

        {error ? <div className="error-msg">{error}</div> : null}
        {loading ? <div className="loading-msg">Loading requests...</div> : null}

        {!loading && requests.length === 0 ? (
          <div className="empty-state">
            <h3>No pending requests</h3>
            <p>All teacher and student registrations are already processed.</p>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map((request) => (
              <RequestCard
                key={request._id}
                user={request}
                onApprove={() => handleAction(request._id, 'approve')}
                onReject={() => handleAction(request._id, 'reject')}
                loading={actionLoading === request._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
