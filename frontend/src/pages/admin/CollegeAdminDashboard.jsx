import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../dashboard.css'; // Ensure we use standard dashboard styles
import { SummaryGrid, DeptOverviewTable, RecentActivityFeed } from '../../components/DashboardComponents';
import { FaUserPlus, FaChalkboardTeacher, FaFileAlt, FaCog } from 'react-icons/fa';

const CollegeAdminDashboard = () => {
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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Fetch Stats
            const statsRes = await axios.get('/api/admin/college-dashboard-stats', config);
            setStats(statsRes.data);

            // Fetch Dept Summary
            const deptRes = await axios.get('/api/admin/department-summary', config);
            // Also fetch the defined departments list (in case there are no users yet)
            const deptListRes = await axios.get('/api/admin/colleges/departments', config);
            const definedDepts = (deptListRes.data && deptListRes.data.departments) || [];

            if (deptRes.data && deptRes.data.length > 0) {
                setDeptSummary(deptRes.data);
            } else if (definedDepts.length > 0) {
                // Map plain department names to the summary object shape expected by the table
                setDeptSummary(definedDepts.map(name => ({ name, teachers: 0, students: 0, avgAttendance: 0 })));
            } else {
                setDeptSummary([]);
            }

            // Fetch Activities
            const activityRes = await axios.get('/api/admin/recent-activity', config);
            setActivities(activityRes.data);

            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner">Loading...</div>;

    return (
        <div className="dashboard-container">
            {/* Sidebar is handled by Layout/Router usually, assuming this is rendered inside Main Content */}

            <div className="content-wrapper">
                <div className="page-header">
                    <h1 className="page-title">College Overview</h1>
                    <p className="page-subtitle">Welcome back, Admin</p>
                </div>

                {/* 1. KPIs */}
                <SummaryGrid stats={stats} />

                <div className="dashboard-grid-layout" style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: '24px',
                    marginBottom: '40px'
                }}>
                    {/* 2. Department Overview */}
                    <div className="left-column">
                        <DeptOverviewTable data={deptSummary} />

                        {/* 3. Approval Section Highlight (If pending approvals exist) */}
                        {stats.pendingApprovals > 0 && (
                            <div className="content-card" style={{ marginTop: '24px', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#ef4444' }}>Action Required</h3>
                                        <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)' }}>
                                            You have <strong>{stats.pendingApprovals} pending requests</strong> waiting for approval.
                                        </p>
                                    </div>
                                    <button className="btn-approve"
                                        style={{ background: '#ef4444', color: 'white', border: 'none' }}
                                        onClick={() => window.location.href = '/admin/approvals'} // Basic nav for now
                                    >
                                        Review Now
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4. Right Column: Quick Actions & Activity */}
                    <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Quick Actions */}
                        <div className="content-card">
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Quick Actions</h3>
                            <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <QuickActionButton icon={<FaChalkboardTeacher />} label="Add Teacher" onClick={() => { }} />
                                <QuickActionButton icon={<FaUserPlus />} label="Add Student" onClick={() => { }} />
                                <QuickActionButton icon={<FaFileAlt />} label="Reports" onClick={() => { }} />
                                <QuickActionButton icon={<FaCog />} label="Settings" onClick={() => { }} />
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <RecentActivityFeed activities={activities} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const QuickActionButton = ({ icon, label, onClick }) => (
    <button onClick={onClick} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
        borderRadius: '12px', color: 'var(--color-text-primary)', cursor: 'pointer', gap: '8px',
        transition: 'all 0.2s'
    }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
    >
        <span style={{ fontSize: '1.2rem', color: 'var(--color-accent)' }}>{icon}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{label}</span>
    </button>
);

export default CollegeAdminDashboard;
