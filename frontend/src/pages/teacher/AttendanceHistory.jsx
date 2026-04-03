import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Calendar, Users } from 'lucide-react';

export default function AttendanceHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/teacher/attendance/history', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Failed to load history');
                }
                setHistory(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <DashboardLayout role="teacher" userName={localStorage.getItem('name')}>
            <div className="page-header">
                <h1 className="page-title">Attendance History</h1>
                <div className="page-subtitle">View past class sessions and logs</div>
            </div>

            <div className="content-card">
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Course</th>
                                    <th>Present / Total</th>
                                    <th>Attendance %</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.length > 0 ? history.map((session) => {
                                    const attendanceRatio = session.total > 0 ? session.present / session.total : 0;

                                    return (
                                    <tr key={session.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={16} />
                                                {session.date}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: '500' }}>{session.course}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Users size={16} />
                                                {session.present} / {session.total}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${attendanceRatio < 0.75 ? 'badge-red' : 'badge-green'}`}
                                                style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    background: attendanceRatio < 0.75 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                                    color: attendanceRatio < 0.75 ? '#ef4444' : '#22c55e'
                                                }}>
                                                {Math.round(attendanceRatio * 100)}%
                                            </span>
                                        </td>
                                        <td>{session.status}</td>
                                    </tr>
                                    );
                                }) : (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No history found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
