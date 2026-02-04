import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Search, AlertTriangle, Mail } from 'lucide-react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

export default function MyStudents() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const isLowAttendancePage = location.pathname.includes('low-attendance');

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const endpoint = isLowAttendancePage
                    ? 'http://localhost:5000/api/teacher/students/low-attendance'
                    : 'http://localhost:5000/api/teacher/students';

                const res = await axios.get(endpoint, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudents(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [isLowAttendancePage]);

    return (
        <DashboardLayout role="teacher" userName={localStorage.getItem('name')}>
            <div className="page-header">
                <h1 className="page-title">{isLowAttendancePage ? 'Low Attendance Students' : 'My Students'}</h1>
                <div className="page-subtitle">
                    {isLowAttendancePage ? 'Students falling below 75% attendance criterion' : 'Manage all students in your assigned classes'}
                </div>
            </div>

            {/* Search Bar */}
            <div className="header-search" style={{ marginBottom: '24px', maxWidth: '400px' }}>
                <Search size={20} className="search-icon" />
                <input type="text" placeholder="Search students..." />
            </div>

            <div className="content-card">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Enrollment ID</th>
                                <th>Email</th>
                                {isLowAttendancePage && <th>Attendance %</th>}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5">Loading...</td></tr>
                            ) : students.length > 0 ? (
                                students.map((s) => (
                                    <tr key={s._id}>
                                        <td style={{ fontWeight: '500' }}>{s.name}</td>
                                        <td>{s.enrollmentId || 'N/A'}</td>
                                        <td>{s.email}</td>
                                        {isLowAttendancePage && (
                                            <td>
                                                <span style={{ color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <AlertTriangle size={16} />
                                                    {s.attendancePct}%
                                                </span>
                                            </td>
                                        )}
                                        <td>
                                            <button className="btn-approve" style={{
                                                padding: '6px 12px', fontSize: '0.85rem', gap: '6px',
                                                background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9'
                                            }}>
                                                <Mail size={14} /> Message
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No students found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
