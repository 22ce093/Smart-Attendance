import { Outlet } from 'react-router-dom'
import DashboardLayout from './DashboardLayout'
import '../pages/dashboard.css'

export default function SuperAdminLayout() {
    const userName = localStorage.getItem('name') || 'Super Admin';

    return (
        <DashboardLayout role="superadmin" userName={userName}>
            <Outlet />
        </DashboardLayout>
    )
}
