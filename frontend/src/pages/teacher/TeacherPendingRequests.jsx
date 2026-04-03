import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { RequestCard, SectionHeader } from '../../components/DashboardWidgets';

export default function TeacherPendingRequests() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPendingStudents = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load pending students');
      }

      setStudents(data);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to load pending students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const handleAction = async (studentId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teacher/${action}/${studentId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${action} student`);
      }

      setStudents((current) => current.filter((student) => student._id !== studentId));
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || `Failed to ${action} student`);
    }
  };

  return (
    <DashboardLayout role="teacher" userName={localStorage.getItem('name')}>
      <div className="page-header">
        <h1 className="page-title">Pending Student Requests</h1>
        <div className="page-subtitle">
          Review new student registrations for your class and approve only genuine enrollments.
        </div>
      </div>

      <div className="content-card">
        <SectionHeader title="Approval Queue" />

        {error && <div className="error-msg">{error}</div>}
        {loading ? <div className="loading-msg">Loading requests...</div> : null}

        {!loading && students.length === 0 ? (
          <div className="empty-state">
            <h3>No pending requests</h3>
            <p>All student approvals are up to date.</p>
          </div>
        ) : (
          <div className="requests-list">
            {students.map((student) => (
              <RequestCard
                key={student._id}
                user={student}
                onApprove={() => handleAction(student._id, 'approve')}
                onReject={() => handleAction(student._id, 'reject')}
                loading={loading}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
