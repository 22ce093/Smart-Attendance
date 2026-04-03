import { useEffect, useMemo, useState } from 'react';

const ROLE_FILTERS = ['student', 'teacher', 'college_admin'];

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [activeRole, setActiveRole] = useState('student');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/all-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load users');
      setUsers(data);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
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

      return [user.name, user.email, user.college, user.enrollmentId, user.teacherId]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [users, activeRole, searchTerm]);

  const handleToggleStatus = async (user) => {
    setActionLoading(user._id);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/toggle-status/${user._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update status');

      setUsers((current) =>
        current.map((item) => (item._id === user._id ? { ...item, status: data.status } : item))
      );
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to update status');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <h1 className="page-title">Manage Users</h1>
        <div className="page-subtitle">Monitor platform-wide user access across all colleges.</div>
      </div>

      <div className="content-card">
        <div className="toolbar-row">
          <div className="tab-group">
            {ROLE_FILTERS.map((role) => (
              <button
                key={role}
                className={activeRole === role ? 'btn-primary tab-btn' : 'btn-secondary tab-btn'}
                style={{ marginTop: 0 }}
                onClick={() => setActiveRole(role)}
              >
                {role.replace('_', ' ')}
              </button>
            ))}
          </div>

          <input
            className="table-search"
            placeholder="Search name, email, college or ID"
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
                  <th>College</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>
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
                      <td>{user.college || 'N/A'}</td>
                      <td>{user.department || 'N/A'}</td>
                      <td>
                        <span className={`status-pill ${user.status === 'APPROVED' ? 'success' : 'danger'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-secondary action-btn"
                          style={{ marginTop: 0 }}
                          disabled={actionLoading === user._id}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {actionLoading === user._id
                            ? 'Saving...'
                            : user.status === 'BLOCKED'
                              ? 'Activate'
                              : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
