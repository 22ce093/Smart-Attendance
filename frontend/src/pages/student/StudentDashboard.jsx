import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { StatCard, SectionHeader } from '../../components/DashboardWidgets';
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin
} from 'lucide-react';

export default function StudentDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/attendance/student/overview', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load attendance overview.');
        }

        setOverview(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'var(--bg-gradient)',
          color: 'white'
        }}
      >
        Loading...
      </div>
    );
  }

  const user = overview?.student;
  const stats = overview?.stats;
  const recentAttendance = overview?.recentAttendance || [];
  const activeSessions = overview?.activeSessions || [];
  const isPending = user?.status === 'PENDING';

  return (
    <DashboardLayout role="student" userName={user?.name || 'Student'}>
      <div className="page-header">
        <h1 className="page-title">Student Dashboard</h1>
        <div className="page-subtitle">Welcome back, {user?.name || 'Student'}!</div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Attendance Rate"
          value={`${stats?.attendanceRate || 0}%`}
          icon={<BarChart3 size={24} />}
          color="green"
        />
        <StatCard
          label="Total Sessions"
          value={stats?.totalSessions || 0}
          icon={<BookOpen size={24} />}
          color="blue"
        />
        <StatCard
          label="Active QR Sessions"
          value={stats?.activeSessions || 0}
          icon={<Clock size={24} />}
          color="orange"
        />
        <StatCard
          label="Last Marked"
          value={
            stats?.lastAttendance
              ? new Date(stats.lastAttendance).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short'
                })
              : 'No record'
          }
          icon={<Calendar size={24} />}
          color="purple"
        />
      </div>

      {isPending && (
        <div className="pending-banner">
          <div className="pending-banner-icon">
            <Clock size={24} />
          </div>
          <div className="pending-banner-content">
            <h3>Approval Pending</h3>
            <p>Your account is still waiting for college approval. You will be able to mark attendance after approval.</p>
          </div>
        </div>
      )}

      <div className="dashboard-main-grid">
        <div className="main-section">
          <SectionHeader title="Recent Attendance" />

          <div className="table-container table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Marked On</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.length > 0 ? (
                  recentAttendance.map((entry) => (
                    <tr key={`${entry.course}-${entry.createdAt}`}>
                      <td>{entry.course}</td>
                      <td>{entry.department}</td>
                      <td>
                        <span className="badge-blue">{entry.status}</span>
                      </td>
                      <td>{new Date(entry.createdAt).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>
                      No attendance records yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="side-section">
          <SectionHeader title="Live Sessions" />
          <div className="schedule-list">
            {activeSessions.length > 0 ? (
              activeSessions.map((session) => (
                <div className="schedule-item" key={`${session.course}-${session.startsAt}`}>
                  <div className="schedule-time">
                    {new Date(session.expiresAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="schedule-details">
                    <div className="schedule-subject">{session.course}</div>
                    <div className="schedule-room">
                      <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                      Ends soon
                    </div>
                  </div>
                  <div className="schedule-status pending">
                    <Clock size={16} />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state compact-empty-state">
                <CheckCircle2 size={28} />
                <p>No active QR sessions right now</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
