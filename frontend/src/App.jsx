import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'
import SelectRole from './pages/SelectRole'
import Register from './pages/Register'
import Login from './pages/Login'
import TeacherPendingRequests from './pages/teacher/TeacherPendingRequests'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import StartAttendance from './pages/teacher/StartAttendance'
import AttendanceHistory from './pages/teacher/AttendanceHistory'
import MyStudents from './pages/teacher/MyStudents'
import TeacherProfile from './pages/teacher/TeacherProfile'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentScan from './pages/student/StudentScan'
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard'
import ManageColleges from './pages/admin/ManageColleges'
import CollegeApprovals from './pages/admin/CollegeApprovals'
import AdminApprovals from './pages/admin/AdminApprovals'
import ManageUsers from './pages/admin/ManageUsers'
import SuperAdminLayout from './components/SuperAdminLayout'

const ThemeToggle = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
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
        fontSize: '1.2rem',
        boxShadow: 'var(--glass-shadow)',
        backdropFilter: 'blur(10px)',
        color: 'var(--color-text-primary)',
        transition: 'all 0.3s ease'
      }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

import AdminLayout from './components/AdminLayout'
import AdminDashboard from './pages/admin/CollegeAdminDashboard' // College Admin Dashboard (New)
import AdminUsers from './pages/admin/AdminUsers'
import AdminCourses from './pages/admin/AdminCourses'
import ManageDepartments from './pages/admin/ManageDepartments'

function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<SelectRole />} />
        <Route path="/register/:role" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Teacher Routes */}
        <Route path="/teacher/pending" element={<TeacherPendingRequests />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/attendance/start" element={<StartAttendance />} />
        <Route path="/teacher/attendance/history" element={<AttendanceHistory />} />
        <Route path="/teacher/students" element={<MyStudents />} />
        <Route path="/teacher/low-attendance" element={<MyStudents />} />
        <Route path="/teacher/profile" element={<TeacherProfile />} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/scan" element={<StudentScan />} />

        {/* Super Admin Routes */}
        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="colleges" element={<ManageColleges />} />
          <Route path="approvals" element={<CollegeApprovals />} />
          <Route path="users" element={<ManageUsers />} />
          <Route index element={<SuperAdminDashboard />} />
        </Route>

        {/* College Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="approvals" element={<AdminApprovals />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="departments" element={<ManageDepartments />} />
          {/* Defaults/Redirects */}
          <Route index element={<AdminDashboard />} />
          <Route path="*" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

