import { useEffect, useState } from 'react';
import { SectionHeader } from '../../components/DashboardWidgets';

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDepartment, setEditingDepartment] = useState('');
  const [renamedDepartment, setRenamedDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadDepartments = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/colleges/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load departments');

      setDepartments(data.departments || []);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const addDepartment = async (event) => {
    event.preventDefault();
    if (!newDepartment.trim()) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/colleges/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newDepartment })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add department');

      setNewDepartment('');
      setDepartments(data.departments || []);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to add department');
    } finally {
      setSaving(false);
    }
  };

  const renameDepartment = async (event) => {
    event.preventDefault();
    if (!editingDepartment || !renamedDepartment.trim()) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/colleges/departments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldName: editingDepartment, newName: renamedDepartment })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to rename department');

      setDepartments(data.departments || []);
      setEditingDepartment('');
      setRenamedDepartment('');
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to rename department');
    } finally {
      setSaving(false);
    }
  };

  const deleteDepartment = async (departmentName) => {
    if (!window.confirm(`Delete department "${departmentName}"?`)) {
      return;
    }

    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/colleges/departments/${encodeURIComponent(departmentName)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete department');

      setDepartments(data.departments || []);
      if (editingDepartment === departmentName) {
        setEditingDepartment('');
        setRenamedDepartment('');
      }
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to delete department');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <h1 className="page-title">Manage Departments</h1>
        <div className="page-subtitle">Add, rename, or remove departments for your college.</div>
      </div>

      <div className="attendance-builder">
        <div className="content-card">
          <SectionHeader title="Department Directory" />
          {error ? <div className="error-msg">{error}</div> : null}
          {loading ? <div className="loading-msg">Loading departments...</div> : null}

          {!loading ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Department</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '32px' }}>
                        No departments found
                      </td>
                    </tr>
                  ) : (
                    departments.map((department, index) => (
                      <tr key={department}>
                        <td>{index + 1}</td>
                        <td>{department}</td>
                        <td>
                          <div className="inline-actions">
                            <button
                              className="btn-secondary action-btn"
                              style={{ marginTop: 0 }}
                              onClick={() => {
                                setEditingDepartment(department);
                                setRenamedDepartment(department);
                              }}
                            >
                              Rename
                            </button>
                            <button className="btn-reject" onClick={() => deleteDepartment(department)}>
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
          <SectionHeader title="Department Actions" />

          <form className="attendance-form-grid" onSubmit={addDepartment}>
            <div className="form-group">
              <label className="form-label">Add Department</label>
              <input className="form-input" value={newDepartment} onChange={(event) => setNewDepartment(event.target.value)} placeholder="e.g. Computer Engineering" />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Add department'}
            </button>
          </form>

          <div className="separator-line" />

          <form className="attendance-form-grid" onSubmit={renameDepartment}>
            <div className="form-group">
              <label className="form-label">Rename Department</label>
              <select className="form-input" value={editingDepartment} onChange={(event) => setEditingDepartment(event.target.value)}>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">New Name</label>
              <input className="form-input" value={renamedDepartment} onChange={(event) => setRenamedDepartment(event.target.value)} placeholder="Updated department name" />
            </div>

            <button type="submit" className="btn-primary" disabled={saving || !editingDepartment}>
              {saving ? 'Saving...' : 'Rename department'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
