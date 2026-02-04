import React from 'react';
import { FaChalkboardTeacher, FaUserGraduate, FaBuilding, FaClipboardCheck, FaClock } from 'react-icons/fa';

export const StatCard = ({ title, value, icon, color }) => {
    return (
        <div className="stat-card">
            <div className="stat-info">
                <h3 className="stat-value">{value}</h3>
                <p className="stat-label">{title}</p>
            </div>
            <div className={`stat-icon ${color}`}>
                {icon}
            </div>
        </div>
    );
};

export const SummaryGrid = ({ stats }) => {
    return (
        <div className="stats-grid">
            <StatCard
                title="Total Departments"
                value={stats.totalDepartments}
                icon={<FaBuilding />}
                color="blue"
            />
            <StatCard
                title="Total Teachers"
                value={stats.totalTeachers}
                icon={<FaChalkboardTeacher />}
                color="purple"
            />
            <StatCard
                title="Total Students"
                value={stats.totalStudents}
                icon={<FaUserGraduate />}
                color="green"
            />
            <StatCard
                title="Avg Attendance"
                value={`${stats.attendancePercentage}%`}
                icon={<FaClipboardCheck />}
                color="orange"
            />
            <StatCard
                title="Pending Requests"
                value={stats.pendingApprovals}
                icon={<FaClock />}
                color="blue"
            />
        </div>
    );
};

export const DeptOverviewTable = ({ data }) => {
    return (
        <div className="content-card">
            <div className="section-header">
                <h2>Department Overview</h2>
            </div>
            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Teachers</th>
                            <th>Students</th>
                            <th>Avg Attendance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? (
                            data.map((dept, index) => (
                                <tr key={index}>
                                    <td style={{ fontWeight: '600' }}>{dept.name}</td>
                                    <td>{dept.teachers}</td>
                                    <td>{dept.students}</td>
                                    <td>
                                        <span className={`badge ${dept.avgAttendance < 75 ? 'badge-red' : 'badge-green'}`}
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                background: dept.avgAttendance < 75 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                                color: dept.avgAttendance < 75 ? '#ef4444' : '#22c55e'
                                            }}>
                                            {dept.avgAttendance}%
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No Department Data Found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const RecentActivityFeed = ({ activities }) => {
    return (
        <div className="content-card">
            <div className="section-header">
                <h2>Recent Activity</h2>
            </div>
            <div className="activity-feed" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activities.map((activity) => (
                    <div key={activity.id} className="activity-item" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid var(--glass-border)'
                    }}>
                        <div className={`activity-dot ${activity.type}`} style={{
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: activity.type === 'success' ? '#22c55e' :
                                activity.type === 'warning' ? '#f59e0b' : '#3b82f6'
                        }}></div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>{activity.text}</p>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{activity.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
