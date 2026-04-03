import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SummaryGrid, DeptOverviewTable, RecentActivityFeed } from '../../components/DashboardComponents';

export default function CollegeAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDepartments: 0,
    totalTeachers: 0,
    totalStudents: 0,
    pendingApprovals: 0,
    attendancePercentage: 0
  });
  const [deptSummary, setDeptSummary] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, deptRes, deptListRes, activityRes] = await Promise.all([
        fetch('/api/admin/college-dashboard-stats', { headers }),
        fetch('/api/admin/department-summary', { headers }),
        fetch('/api/admin/colleges/departments', { headers }),
        fetch('/api/admin/recent-activity', { headers })
      ]);

      const [statsData, deptData, deptListData, activityData] = await Promise.all([
        statsRes.json(),
        deptRes.json(),
        deptListRes.json(),
        activityRes.json()
      ]);

      if (!statsRes.ok) throw new Error(statsData.message || 'Failed to load dashboard stats');
      if (!deptRes.ok) throw new Error(deptData.message || 'Failed to load department summary');
      if (!deptListRes.ok) throw new Error(deptListData.message || 'Failed to load departments');
      if (!activityRes.ok) throw new Error(activityData.message || 'Failed to load recent activity');

      setStats(statsData);

      const definedDepts = deptListData.departments || [];
      if (deptData.length > 0) {
        setDeptSummary(deptData);
      } else if (definedDepts.length > 0) {
        setDeptSummary(
          definedDepts.map((name) => ({
            name,
            teachers: 0,
            students: 0,
            avgAttendance: 0
          }))
        );
      } else {
        setDeptSummary([]);
      }

      setActivities(activityData);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-msg">Loading dashboard...</div>;
  }

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <h1 className="page-title">College Overview</h1>
        <div className="page-subtitle">Track approvals, departments, and overall attendance from one place.</div>
      </div>

      {error ? <div className="error-msg">{error}</div> : null}

      <SummaryGrid stats={stats} />

      <div className="attendance-builder">
        <div>
          <DeptOverviewTable data={deptSummary} />

          {stats.pendingApprovals > 0 ? (
            <div
              className="content-card"
              style={{
                marginTop: '24px',
                borderColor: 'rgba(249, 115, 22, 0.35)',
                background: 'rgba(249, 115, 22, 0.07)'
              }}
            >
              <h3 style={{ marginBottom: '8px' }}>Approvals waiting</h3>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                {stats.pendingApprovals} teacher or student registrations still need review.
              </p>
              <button
                className="btn-primary"
                style={{ marginTop: '16px' }}
                onClick={() => navigate('/admin/approvals')}
              >
                Open approvals
              </button>
            </div>
          ) : null}
        </div>

        <div className="scan-status-card">
          <div className="content-card">
            <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
            <div className="scan-actions">
              <button className="btn-secondary action-btn" onClick={() => navigate('/admin/approvals')}>
                Review approvals
              </button>
              <button className="btn-secondary action-btn" onClick={() => navigate('/admin/users')}>
                Manage users
              </button>
              <button className="btn-secondary action-btn" onClick={() => navigate('/admin/courses')}>
                Manage courses
              </button>
              <button className="btn-secondary action-btn" onClick={() => navigate('/admin/departments')}>
                Manage departments
              </button>
            </div>
          </div>

          <RecentActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
