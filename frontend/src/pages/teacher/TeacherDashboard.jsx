import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { RequestCard, SectionHeader, StatCard } from '../../components/DashboardWidgets';
import { AlertTriangle, BarChart3, BookOpen, QrCode, UserCheck } from 'lucide-react';

export default function TeacherDashboard() {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    todaysClasses: 0,
    activeSession: 'None',
    avgAttendance: '0%'
  });

  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('name') || 'Teacher';

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, pendingRes, historyRes, lowAttendanceRes] = await Promise.all([
        fetch('/api/teacher/dashboard-stats', { headers }),
        fetch('/api/teacher/pending', { headers }),
        fetch('/api/teacher/attendance/history', { headers }),
        fetch('/api/teacher/students/low-attendance', { headers })
      ]);

      const [statsData, pendingData, historyData, lowAttendanceData] = await Promise.all([
        statsRes.json(),
        pendingRes.json(),
        historyRes.json(),
        lowAttendanceRes.json()
      ]);

      if (!statsRes.ok) throw new Error(statsData.message || 'Failed to load stats');
      if (!pendingRes.ok) throw new Error(pendingData.message || 'Failed to load pending students');
      if (!historyRes.ok) throw new Error(historyData.message || 'Failed to load attendance history');
      if (!lowAttendanceRes.ok) throw new Error(lowAttendanceData.message || 'Failed to load low attendance data');

      setStats(statsData);
      setPendingStudents(pendingData);
      setRecentSessions(historyData.slice(0, 4));
      setLowAttendanceStudents(lowAttendanceData.slice(0, 4));
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

  const handleAction = async (studentId, action) => {
    setActionLoading(studentId);
    setError('');

    try {
      const response = await fetch(`/api/teacher/${action}/${studentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to ${action} student`);

      setPendingStudents((current) => current.filter((student) => student._id !== studentId));
      await loadDashboard();
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || `Failed to ${action} student`);
    } finally {
      setActionLoading('');
    }
  };

  return (
    <DashboardLayout role="teacher" userName={userName}>
      <div className="page-header">
        <h1 className="page-title">Teacher Dashboard</h1>
        <div className="page-subtitle">Monitor attendance activity, pending requests, and student risk alerts.</div>
      </div>

      {error ? <div className="error-msg">{error}</div> : null}

      <div className="stats-grid">
        <StatCard label="Today's Classes" value={stats.todaysClasses} icon={<BookOpen size={24} />} color="blue" />
        <StatCard label="Active QR Session" value={stats.activeSession} icon={<QrCode size={24} />} color="purple" />
        <StatCard label="Pending Approvals" value={stats.pendingApprovals} icon={<UserCheck size={24} />} color="orange" />
        <StatCard label="Avg Attendance" value={stats.avgAttendance} icon={<BarChart3 size={24} />} color="green" />
      </div>

      <div className="attendance-builder">
        <div className="content-card">
          <SectionHeader title="Pending Student Approvals" />

          {loading ? <div className="loading-msg">Loading requests...</div> : null}

          {!loading && pendingStudents.length === 0 ? (
            <div className="empty-state compact-empty-state">
              <p>No pending student requests</p>
            </div>
          ) : (
            <div className="requests-list">
              {pendingStudents.map((student) => (
                <RequestCard
                  key={student._id}
                  user={student}
                  onApprove={() => handleAction(student._id, 'approve')}
                  onReject={() => handleAction(student._id, 'reject')}
                  loading={actionLoading === student._id}
                />
              ))}
            </div>
          )}
        </div>

        <div className="scan-status-card">
          <div className="content-card">
            <SectionHeader title="Recent Attendance Sessions" />
            {recentSessions.length === 0 ? (
              <div className="empty-state compact-empty-state">
                <p>No sessions recorded yet</p>
              </div>
            ) : (
              <div className="schedule-list">
                {recentSessions.map((session) => (
                  <div className="schedule-item" key={session.id}>
                    <div className="schedule-time">{session.date}</div>
                    <div className="schedule-details">
                      <div className="schedule-subject">{session.course}</div>
                      <div className="schedule-room">
                        {session.present} / {session.total} students present
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="content-card">
            <SectionHeader title="Low Attendance Alerts" />
            {lowAttendanceStudents.length === 0 ? (
              <div className="empty-state compact-empty-state">
                <p>No students are currently below the threshold.</p>
              </div>
            ) : (
              <div className="requests-list">
                {lowAttendanceStudents.map((student) => (
                  <div key={student._id} className="request-card">
                    <div className="request-info">
                      <div className="request-name">{student.name}</div>
                      <div className="request-email">
                        <AlertTriangle size={14} />
                        <span>{student.attendancePct}% attendance</span>
                      </div>
                    </div>
                    <div className="status-pill danger">{student.attendancePct}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
