import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    QrCode,
    UserCheck,
    AlertTriangle
} from 'lucide-react';
import '../pages/dashboard.css';

export default function DashboardLayout({ children, role, userName }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Determine sidebar items based on role
    const getSidebarItems = (role) => {
        const commonItems = [
            { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
        ];

        switch (role) {
            case 'superadmin':
                return [
                    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/superadmin/dashboard' },
                    { icon: <Building2 size={20} />, label: 'College Admin Approvals', path: '/superadmin/approvals' },
                    { icon: <Users size={20} />, label: 'Manage Users', path: '/superadmin/users' },
                    { icon: <Building2 size={20} />, label: 'Manage Colleges', path: '/superadmin/colleges' },
                    { icon: <FileText size={20} />, label: 'Reports', path: '/superadmin/reports' },
                    { icon: <Settings size={20} />, label: 'Settings', path: '/superadmin/settings' },
                ];
            case 'admin': // College Admin
                return [
                    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
                    { icon: <UserCheck size={20} />, label: 'Teacher Approvals', path: '/admin/teacher-approvals' },
                    { icon: <Users size={20} />, label: 'Student Approvals', path: '/admin/student-approvals' },
                    { icon: <Building2 size={20} />, label: 'Manage Departments', path: '/admin/departments' },
                    { icon: <FileText size={20} />, label: 'Reports', path: '/admin/reports' },
                    { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
                ];
            case 'teacher':
                return [
                    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/teacher/dashboard' },
                    { icon: <QrCode size={20} />, label: 'Start Attendance', path: '/teacher/attendance/start' },
                    { icon: <FileText size={20} />, label: 'Attendance History', path: '/teacher/attendance/history' },
                    { icon: <Users size={20} />, label: 'My Students', path: '/teacher/students' },
                    { icon: <UserCheck size={20} />, label: 'Student Requests', path: '/teacher/pending' },
                    { icon: <AlertTriangle size={20} />, label: 'Low Attendance', path: '/teacher/low-attendance' },
                    { icon: <Settings size={20} />, label: 'Profile', path: '/teacher/profile' },
                ];
            case 'student':
                return [
                    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/student/dashboard' },
                    { icon: <QrCode size={20} />, label: 'Scan QR', path: '/student/scan' },
                    { icon: <FileText size={20} />, label: 'Attendance Reports', path: '/student/reports' },
                    { icon: <Settings size={20} />, label: 'Settings', path: '/student/settings' },
                ];
            default:
                return commonItems;
        }
    };

    const sidebarItems = getSidebarItems(role);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        localStorage.removeItem('userId');
        navigate('/login');
    };

    const getRoleLabel = () => {
        if (role === 'superadmin') return 'Super Admin';
        if (role === 'admin') return 'College Admin';
        return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
    };

    return (
        <div className="dashboard-container">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-icon">Scan2</span>Attendance
                    </div>
                </div>

                <div className="user-mini-profile">
                    <div className="user-avatar">
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{userName || 'User'}</div>
                        <div className="user-role">{getRoleLabel()}</div>
                    </div>
                </div>

                <nav className="nav-links">
                    {sidebarItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-item ${isActive || location.pathname === item.path ? 'active' : ''}`
                            }
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                {/* Top Header */}
                <header className="top-header">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <div className="header-actions">
                        <div className="header-date">
                            {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="content-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
}
