import '../dashboard.css'

export default function AdminCourses() {
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Course Management</h1>
                <div className="page-subtitle">Create and assign courses to faculty</div>
            </div>

            <div style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                padding: '40px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)'
            }}>
                <h2>Course List (Coming Soon)</h2>
                <p>This page will allow admins to manage courses and enrollments.</p>
                <div style={{ fontSize: '3rem', margin: '20px 0' }}>📚</div>
            </div>
        </div>
    )
}
