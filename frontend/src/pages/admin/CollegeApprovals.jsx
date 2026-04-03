import { useEffect, useState } from 'react';
import { RequestCard, SectionHeader } from '../../components/DashboardWidgets';

export default function CollegeApprovals() {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const fetchPendingAdmins = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/pending-college-admins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load approval requests');
      setPendingAdmins(data);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to load approval requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingAdmins();
  }, []);

  const handleAction = async (adminId, action) => {
    setActionLoading(adminId);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/${action}-college-admin/${adminId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to ${action} admin`);

      setPendingAdmins((current) => current.filter((admin) => admin._id !== adminId));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || `Failed to ${action} admin`);
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <h1 className="page-title">College Admin Approvals</h1>
        <div className="page-subtitle">Approve or reject new institutions before they enter the platform.</div>
      </div>

      <div className="content-card">
        <SectionHeader title="Approval Queue" />

        {error ? <div className="error-msg">{error}</div> : null}
        {loading ? <div className="loading-msg">Loading approvals...</div> : null}

        {!loading && pendingAdmins.length === 0 ? (
          <div className="empty-state">
            <h3>No pending requests</h3>
            <p>All college admin registrations have been reviewed.</p>
          </div>
        ) : (
          <div className="requests-list">
            {pendingAdmins.map((admin) => (
              <RequestCard
                key={admin._id}
                user={admin}
                onApprove={() => handleAction(admin._id, 'approve')}
                onReject={() => handleAction(admin._id, 'reject')}
                loading={actionLoading === admin._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
