import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../pages/auth.css' // Reusing auth styles or create new ones? Better to use inline or a new css file if specific.
// Using simple inline styles for now to ensure it works.

export default function TeacherPendingRequests() {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetchPendingStudents()
    }, [])

    const fetchPendingStudents = async () => {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                navigate('/login')
                return
            }

            const res = await fetch('/api/teacher/pending', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch pending requests')
            }

            setStudents(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this student?`)) return

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/teacher/${action}/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || `Failed to ${action} student`)

            // Remove student from list locally
            setStudents(students.filter(s => s._id !== id))
            alert(`Student ${action}d successfully`)
        } catch (err) {
            alert(err.message)
        }
    }

    if (loading) return <div style={{ padding: '20px', color: 'white' }}>Loading...</div>

    return (
        <div style={{ padding: '20px', color: 'var(--color-text-primary)' }}>
            <h2>Pending Student Approvals</h2>
            <button onClick={() => navigate('/')} style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}>Back to Home</button>

            {error && <div className="error-msg">{error}</div>}

            {students.length === 0 ? (
                <p>No pending requests.</p>
            ) : (
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {students.map(student => (
                        <div key={student._id} style={{
                            background: 'var(--glass-bg)',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid var(--glass-border)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>{student.name}</h3>
                            <p><strong>Email:</strong> {student.email}</p>
                            <p><strong>Phone:</strong> {student.phone}</p>
                            <p><strong>Dept:</strong> {student.department}</p>
                            <p><strong>Enrollment ID:</strong> {student.enrollmentId}</p>
                            <p><strong>College:</strong> {student.college}</p>
                            <p><strong>Role:</strong> {student.role}</p>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button
                                    onClick={() => handleAction(student._id, 'approve')}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleAction(student._id, 'reject')}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
