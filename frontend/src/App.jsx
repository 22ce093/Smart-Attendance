import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'
import SelectRole from './pages/SelectRole'
import Register from './pages/Register'
import Login from './pages/Login'
import TeacherPendingRequests from './pages/teacher/TeacherPendingRequests'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import StudentDashboard from './pages/student/StudentDashboard'
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard'

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
import AdminDashboard from './pages/admin/AdminDashboard' // College Admin Dashboard
import AdminUsers from './pages/admin/AdminUsers'
import AdminCourses from './pages/admin/AdminCourses'

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

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />

        {/* Super Admin Routes */}
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />

        {/* College Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCourses />} />
          {/* Defaults/Redirects */}
          <Route index element={<AdminDashboard />} />
          <Route path="*" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

