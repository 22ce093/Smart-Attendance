import { useState, useEffect } from 'react'
import '../dashboard.css'

export default function AdminUsers() {
    const [activeTab, setActiveTab] = useState('list')
    const [users, setUsers] = useState([])
    const [pendingTeachers, setPendingTeachers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Form state for Create User
    const [newUser, setNewUser] = useState({
        name: '', email: '', password: '', role: 'student', phone: '', department: '', college: '', enrollmentId: ''
    })

    useEffect(() => {
        if (activeTab === 'list') fetchUsers()
        if (activeTab === 'pending') fetchPendingTeachers()
    }, [activeTab])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)
            setUsers(data)
        } catch (err) { setError(err.message) } finally { setLoading(false) }
    }

    const fetchPendingTeachers = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/pending-teachers', { headers: { 'Authorization': `Bearer ${token}` } })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)
            setPendingTeachers(data)
        } catch (err) { setError(err.message) } finally { setLoading(false) }
    }

    const handleCreateUser = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message)
            alert('User created successfully')
            setNewUser({ name: '', email: '', password: '', role: 'student', phone: '', department: '', college: '', enrollmentId: '' })
        } catch (err) {
            alert(err.message)
        }
    }

    const handleTeacherAction = async (id, action) => {
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`/api/admin/${action}/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!res.ok) throw new Error('Action failed')
            setPendingTeachers(pendingTeachers.filter(t => t._id !== id))
            alert(`Teacher ${action}d`)
        } catch (err) { alert(err.message) }
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">User Management</h1>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button onClick={() => setActiveTab('list')} className={activeTab === 'list' ? 'btn-primary' : 'btn-back'}>All Users</button>
                    <button onClick={() => setActiveTab('create')} className={activeTab === 'create' ? 'btn-primary' : 'btn-back'}>Create User</button>
                    <button onClick={() => setActiveTab('pending')} className={activeTab === 'pending' ? 'btn-primary' : 'btn-back'}>Pending Teachers</button>
                </div>
            </div>

            <div style={{ background: 'var(--glass-bg)', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
                {error && <div className="error-msg">{error}</div>}
                {loading && <p>Loading...</p>}

                {activeTab === 'list' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                        <thead>
                            <tr style={{ textAlign: 'left' }}>
                                <th>Name</th><th>Email</th><th>Role</th><th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <td style={{ padding: '10px' }}>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>{u.role}</td>
                                    <td>{u.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {activeTab === 'create' && (
                    <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: '15px', maxWidth: '500px' }}>
                        <input className="form-input" placeholder="Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required />
                        <input className="form-input" placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                        <input className="form-input" placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                        <select className="form-input" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                        </select>
                        <input className="form-input" placeholder="Phone" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
                        <input className="form-input" placeholder="College" value={newUser.college} onChange={e => setNewUser({ ...newUser, college: e.target.value })} />
                        <input className="form-input" placeholder="Department" value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })} />
                        {newUser.role === 'student' && (
                            <input className="form-input" placeholder="Enrollment ID" value={newUser.enrollmentId} onChange={e => setNewUser({ ...newUser, enrollmentId: e.target.value })} />
                        )}
                        <button type="submit" className="btn-primary">Create User</button>
                    </form>
                )}

                {activeTab === 'pending' && (
                    <div>
                        {pendingTeachers.length === 0 ? <p>No pending teachers</p> : (
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {pendingTeachers.map(t => (
                                    <div key={t._id} style={{ border: '1px solid white', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <strong>{t.name}</strong> ({t.email}) - {t.department} / {t.college}
                                        </div>
                                        <div>
                                            <button onClick={() => handleTeacherAction(t._id, 'approve')} style={{ marginRight: '10px', background: 'green', color: 'white', border: 'none', padding: '5px 10px' }}>Approve</button>
                                            <button onClick={() => handleTeacherAction(t._id, 'reject')} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px' }}>Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
