import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import '../pages/dashboard.css';
import { clearStoredAuth } from '../auth';

const SIDEBAR_ITEMS = {
  superadmin: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/superadmin/dashboard' },
    { icon: <Building2 size={20} />, label: 'Manage Colleges', path: '/superadmin/colleges' },
    { icon: <ShieldCheck size={20} />, label: 'Approvals', path: '/superadmin/approvals' }
  ],
  college_admin: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: <ClipboardCheck size={20} />, label: 'Approvals', path: '/admin/approvals' },
    { icon: <Users size={20} />, label: 'Users', path: '/admin/users' },
    { icon: <BookOpen size={20} />, label: 'Courses', path: '/admin/courses' },
    { icon: <Building2 size={20} />, label: 'Departments', path: '/admin/departments' }
  ],
  teacher: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/teacher/dashboard' },
    { icon: <QrCode size={20} />, label: 'Start Attendance', path: '/teacher/attendance/start' },
    { icon: <FileText size={20} />, label: 'Attendance History', path: '/teacher/attendance/history' },
    { icon: <Users size={20} />, label: 'My Students', path: '/teacher/students' },
    { icon: <UserCheck size={20} />, label: 'Pending Students', path: '/teacher/pending' },
    { icon: <AlertTriangle size={20} />, label: 'Low Attendance', path: '/teacher/low-attendance' },
    { icon: <Settings size={20} />, label: 'Profile', path: '/teacher/profile' }
  ],
  student: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/student/dashboard' },
    { icon: <QrCode size={20} />, label: 'Scan QR', path: '/student/scan' }
  ]
};

const ROLE_LABELS = {
  superadmin: 'Super Admin',
  college_admin: 'College Admin',
  teacher: 'Teacher',
  student: 'Student'
};

export default function DashboardLayout({ children, role, userName }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const sidebarItems = SIDEBAR_ITEMS[role] || [];

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

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
            <div className="user-role">{ROLE_LABELS[role] || 'User'}</div>
          </div>
        </div>

        <nav className="nav-links">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
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

      <main className="main-content">
        <header className="top-header">
          <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen((current) => !current)}>
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="header-actions">
            <div className="header-date">
              {new Date().toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </div>
          </div>
        </header>

        <div className="content-wrapper">{children}</div>
      </main>
    </div>
  );
}
