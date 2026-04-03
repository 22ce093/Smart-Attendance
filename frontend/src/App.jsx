import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './App.css';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import SuperAdminLayout from './components/SuperAdminLayout';
import SelectRole from './pages/SelectRole';
import Register from './pages/Register';
import Login from './pages/Login';
import TeacherPendingRequests from './pages/teacher/TeacherPendingRequests';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StartAttendance from './pages/teacher/StartAttendance';
import AttendanceHistory from './pages/teacher/AttendanceHistory';
import MyStudents from './pages/teacher/MyStudents';
import TeacherProfile from './pages/teacher/TeacherProfile';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentScan from './pages/student/StudentScan';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import ManageColleges from './pages/admin/ManageColleges';
import CollegeApprovals from './pages/admin/CollegeApprovals';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminDashboard from './pages/admin/CollegeAdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import ManageDepartments from './pages/admin/ManageDepartments';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '1rem',
        boxShadow: 'var(--glass-shadow)',
        backdropFilter: 'blur(10px)',
        color: 'var(--color-text-primary)',
        transition: 'all 0.3s ease'
      }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? 'L' : 'D'}
    </button>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<SelectRole />} />
        <Route path="/register/:role" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/pending" element={<TeacherPendingRequests />} />
          <Route path="/teacher/attendance/start" element={<StartAttendance />} />
          <Route path="/teacher/attendance/history" element={<AttendanceHistory />} />
          <Route path="/teacher/students" element={<MyStudents />} />
          <Route path="/teacher/low-attendance" element={<MyStudents />} />
          <Route path="/teacher/profile" element={<TeacherProfile />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/scan" element={<StudentScan />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
          <Route path="/superadmin" element={<SuperAdminLayout />}>
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="colleges" element={<ManageColleges />} />
            <Route path="approvals" element={<CollegeApprovals />} />
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['college_admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="departments" element={<ManageDepartments />} />
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
