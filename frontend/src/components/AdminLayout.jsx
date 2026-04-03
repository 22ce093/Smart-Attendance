import { Outlet } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import '../pages/dashboard.css'

export default function AdminLayout() {
    const userName = localStorage.getItem('name') || 'College Admin'; // Or fetch from context

    return (
        <DashboardLayout role="college_admin" userName={userName}>
            <Outlet />
        </DashboardLayout>
    )
}
