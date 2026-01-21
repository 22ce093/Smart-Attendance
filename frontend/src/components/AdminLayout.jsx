import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import '../pages/dashboard.css'

export default function AdminLayout() {
    const navigate = useNavigate()
    // Add mobile menu toggle state if needed later

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        navigate('/login')
    }

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">SCAN2ATTENDANCE</div>
                </div>

                <nav className="nav-links">
                    <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">📊</span>
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">👥</span>
                        <span>Users</span>
                    </NavLink>

                    <NavLink to="/admin/courses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">📚</span>
                        <span>Courses</span>
                    </NavLink>

                    <NavLink to="/admin/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">📈</span>
                        <span>Reports</span>
                    </NavLink>

                    <NavLink to="/admin/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">⚙️</span>
                        <span>Settings</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <span className="nav-icon">🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}
