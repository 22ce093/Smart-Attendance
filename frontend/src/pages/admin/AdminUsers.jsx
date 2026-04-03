import { useEffect, useMemo, useState } from 'react';
import { SectionHeader } from '../../components/DashboardWidgets';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'student',
  phone: '',
  department: '',
  enrollmentId: '',
  teacherId: '',
  status: 'APPROVED'
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRole, setActiveRole] = useState('student');
  const [editingUserId, setEditingUserId] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  const loadPageData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, departmentsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/colleges/departments', { headers })
      ]);

      const [usersData, departmentsData] = await Promise.all([usersRes.json(), departmentsRes.json()]);

      if (!usersRes.ok) throw new Error(usersData.message || 'Failed to load users');
      if (!departmentsRes.ok) throw new Error(departmentsData.message || 'Failed to load departments');

      setUsers(usersData);
      setDepartments(departmentsData.departments || []);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      if (user.role !== activeRole) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [user.name, user.email, user.enrollmentId, user.teacherId, user.department]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [users, activeRole, searchTerm]);

  const resetForm = () => {
    setEditingUserId('');
    setForm(INITIAL_FORM);
  };

  const startEdit = (user) => {
    setEditingUserId(user._id);
    setActiveRole(user.role);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role,
      phone: user.phone || '',
      department: user.department || '',
      enrollmentId: user.enrollmentId || '',
      teacherId: user.teacherId || '',
      status: user.status || 'APPROVED'
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const isEditing = Boolean(editingUserId);
      const endpoint = isEditing ? `/api/admin/users/${editingUserId}` : '/api/admin/create-user';
      const method = isEditing ? 'PUT' : 'POST';
      const payload = isEditing
        ? {
            name: form.name,
            email: form.email,
            phone: form.phone,
            department: form.department,
            status: form.status
          }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            phone: form.phone,
            department: form.department,
            enrollmentId: form.role === 'student' ? form.enrollmentId : undefined,
            teacherId: form.role === 'teacher' ? form.teacherId : undefined
          };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save user');

      await loadPageData();
      resetForm();
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete user');

      await loadPageData();
      if (editingUserId === userId) {
        resetForm();
      }
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to delete user');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <h1 className="page-title">College Users</h1>
        <div className="page-subtitle">Create, edit, and remove teacher or student accounts for your college.</div>
      </div>

      <div className="attendance-builder">
        <div className="content-card">
          <SectionHeader title="User Directory" />

          <div className="toolbar-row">
            <div className="tab-group">
              {['student', 'teacher'].map((role) => (
                <button
                  key={role}
                  className={activeRole === role ? 'btn-primary tab-btn' : 'btn-secondary tab-btn'}
                  style={{ marginTop: 0 }}
                  onClick={() => setActiveRole(role)}
                >
                  {role}s
                </button>
              ))}
            </div>

            <input
              className="table-search"
              placeholder="Search by name, email or ID"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          {error ? <div className="error-msg">{error}</div> : null}
          {loading ? <div className="loading-msg">Loading users...</div> : null}

          {!loading ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>
                        No users found for this filter
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{user.name}</div>
                          <div className="muted-copy">{user.enrollmentId || user.teacherId || user.role}</div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.department || 'N/A'}</td>
                        <td>
                          <span className={`status-pill ${user.status === 'APPROVED' ? 'success' : 'danger'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td>
                          <div className="inline-actions">
                            <button className="btn-secondary action-btn" style={{ marginTop: 0 }} onClick={() => startEdit(user)}>
                              Edit
                            </button>
                            <button className="btn-reject" onClick={() => handleDelete(user._id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className="content-card">
          <SectionHeader title={editingUserId ? 'Edit User' : 'Create User'} />

          <form className="attendance-form-grid" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            </div>

            {!editingUserId ? (
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
              </div>
            ) : null}

            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                className="form-input"
                value={form.role}
                disabled={Boolean(editingUserId)}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="form-input"
                value={form.department}
                onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                required
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </div>

            {!editingUserId && form.role === 'student' ? (
              <div className="form-group">
                <label className="form-label">Enrollment ID</label>
                <input className="form-input" value={form.enrollmentId} onChange={(event) => setForm((current) => ({ ...current, enrollmentId: event.target.value.toUpperCase() }))} required />
              </div>
            ) : null}

            {!editingUserId && form.role === 'teacher' ? (
              <div className="form-group">
                <label className="form-label">Teacher ID</label>
                <input className="form-input" value={form.teacherId} onChange={(event) => setForm((current) => ({ ...current, teacherId: event.target.value.toUpperCase() }))} required />
              </div>
            ) : null}

            {editingUserId ? (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            ) : null}

            <div className="form-actions">
              {editingUserId ? (
                <button type="button" className="btn-secondary action-btn" style={{ marginTop: 0 }} onClick={resetForm}>
                  Cancel edit
                </button>
              ) : null}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingUserId ? 'Update user' : 'Create user'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
