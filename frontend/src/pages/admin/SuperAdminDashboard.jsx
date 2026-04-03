import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CalendarCheck, Clock, Users } from 'lucide-react';
import { RequestCard, SectionHeader, StatCard } from '../../components/DashboardWidgets';

export default function SuperAdminDashboard() {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({
    totalColleges: 0,
    activeStudents: 0,
    totalTeachers: 0,
    attendanceSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, pendingRes, collegesRes] = await Promise.all([
        fetch('/api/admin/dashboard-stats', { headers }),
        fetch('/api/admin/pending-college-admins', { headers }),
        fetch('/api/admin/colleges', { headers })
      ]);

      const [statsData, pendingData, collegesData] = await Promise.all([
        statsRes.json(),
        pendingRes.json(),
        collegesRes.json()
      ]);

      if (!statsRes.ok) throw new Error(statsData.message || 'Failed to load stats');
      if (!pendingRes.ok) throw new Error(pendingData.message || 'Failed to load approvals');
      if (!collegesRes.ok) throw new Error(collegesData.message || 'Failed to load colleges');

      setStats(statsData);
      setPendingAdmins(pendingData);

      const activityItems = [
        ...collegesData.slice(0, 6).map((college) => ({
          id: `college-${college._id}`,
          text: `${college.name} was added to the platform`,
          time: new Date(college.createdAt).toLocaleString('en-IN'),
          date: college.createdAt
        })),
        ...pendingData.map((admin) => ({
          id: `admin-${admin._id}`,
          text: `${admin.name} is waiting for college admin approval`,
          time: new Date(admin.createdAt).toLocaleString('en-IN'),
          date: admin.createdAt
        }))
      ]
        .sort((left, right) => new Date(right.date) - new Date(left.date))
        .slice(0, 8);

      setRecentActivity(activityItems);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleAction = async (adminId, action) => {
    setActionLoading(adminId);
    setError('');

    try {
      const response = await fetch(`/api/admin/${action}-college-admin/${adminId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to ${action} admin`);

      setPendingAdmins((current) => current.filter((admin) => admin._id !== adminId));
      await loadDashboard();
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
        <h1 className="page-title">Super Admin Dashboard</h1>
        <div className="page-subtitle">Platform-wide college, user, and attendance activity overview.</div>
      </div>

      {error ? <div className="error-msg">{error}</div> : null}

      <div className="stats-grid">
        <StatCard label="Total Colleges" value={stats.totalColleges} icon={<Building2 size={24} />} color="purple" />
        <StatCard label="Active Students" value={stats.activeStudents} icon={<Users size={24} />} color="blue" />
        <StatCard label="Total Teachers" value={stats.totalTeachers} icon={<Users size={24} />} color="green" />
        <StatCard
          label="Attendance Sessions"
          value={stats.attendanceSessions}
          icon={<CalendarCheck size={24} />}
          color="orange"
        />
      </div>

      <div className="attendance-builder">
        <div className="content-card">
          <SectionHeader
            title="Pending College Admin Approvals"
            action={
              <Link to="/superadmin/approvals" className="btn-secondary action-btn" style={{ marginTop: 0 }}>
                Open full queue
              </Link>
            }
          />

          {loading ? <div className="loading-msg">Loading approvals...</div> : null}

          {!loading && pendingAdmins.length === 0 ? (
            <div className="empty-state compact-empty-state">
              <Clock size={28} />
              <p>No pending college admin requests right now.</p>
            </div>
          ) : (
            <div className="requests-list">
              {pendingAdmins.slice(0, 5).map((admin) => (
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

        <div className="content-card">
          <SectionHeader title="Recent Platform Activity" />
          {recentActivity.length === 0 ? (
            <div className="empty-state compact-empty-state">
              <p>No activity recorded yet.</p>
            </div>
          ) : (
            <div className="activity-feed">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="activity-row">
                  <div className="activity-row-text">{activity.text}</div>
                  <div className="activity-row-time">{activity.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
