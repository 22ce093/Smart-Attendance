import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { AlertTriangle, Mail, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function MyStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const isLowAttendancePage = location.pathname.includes('low-attendance');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const endpoint = isLowAttendancePage
          ? '/api/teacher/students/low-attendance'
          : '/api/teacher/students';

        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load students');
        }

        setStudents(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [isLowAttendancePage]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) =>
      [student.name, student.email, student.enrollmentId, student.department]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    );
  }, [students, searchTerm]);

  return (
    <DashboardLayout role="teacher" userName={localStorage.getItem('name')}>
      <div className="page-header">
        <h1 className="page-title">
          {isLowAttendancePage ? 'Low Attendance Students' : 'My Students'}
        </h1>
        <div className="page-subtitle">
          {isLowAttendancePage
            ? 'Students falling below the 75% attendance threshold in your classes.'
            : 'Track the approved students assigned to your class and their live attendance percentage.'}
        </div>
      </div>

      <div className="header-search" style={{ marginBottom: '24px', maxWidth: '420px' }}>
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search students by name, email or enrollment ID"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <div className="content-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Enrollment ID</th>
                <th>Email</th>
                <th>Attendance %</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">Loading...</td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td style={{ fontWeight: '500' }}>{student.name}</td>
                    <td>{student.enrollmentId || 'N/A'}</td>
                    <td>{student.email}</td>
                    <td>
                      <span
                        style={{
                          color: student.attendancePct < 75 ? '#ef4444' : '#22c55e',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {student.attendancePct < 75 && <AlertTriangle size={16} />}
                        {student.attendancePct}%
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-approve"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.85rem',
                          gap: '6px',
                          background: 'rgba(14, 165, 233, 0.1)',
                          color: '#0ea5e9'
                        }}
                      >
                        <Mail size={14} /> Message
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
