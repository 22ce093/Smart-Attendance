import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import './Modal.css';

export default function ViewEditCollegeModal({ college, mode = 'view', onClose, onSaved }) {
  const [formData, setFormData] = useState({});
  const [departmentsText, setDepartmentsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!college) {
      return;
    }

    setFormData({
      name: college.name || '',
      code: college.code || '',
      university: college.university || '',
      emailDomain: college.emailDomain || '',
      status: college.status || 'APPROVED',
      isActive: typeof college.isActive === 'boolean' ? college.isActive : true,
      maxStudents: college.maxStudents || 1000,
      maxTeachers: college.maxTeachers || 50
    });
    setDepartmentsText((college.departments || []).join('\n'));
  }, [college]);

  if (!college) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/colleges/${college._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          departments: departmentsText
            .split('\n')
            .map((department) => department.trim())
            .filter(Boolean)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update college');
      if (onSaved) onSaved(data);
      onClose();
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to update college');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{mode === 'view' ? 'College Details' : 'Edit College'}</h2>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error ? <div className="error-msg">{error}</div> : null}

          <div className="form-grid">
            <div className="form-group">
              <label>College Name</label>
              {mode === 'view' ? (
                <div className="readonly-field">{formData.name}</div>
              ) : (
                <input value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
              )}
            </div>

            <div className="form-group">
              <label>College Code</label>
              <div className="readonly-field">{formData.code}</div>
            </div>

            <div className="form-group">
              <label>University</label>
              {mode === 'view' ? (
                <div className="readonly-field">{formData.university}</div>
              ) : (
                <input value={formData.university} onChange={(event) => setFormData((current) => ({ ...current, university: event.target.value }))} />
              )}
            </div>

            <div className="form-group">
              <label>Email Domain</label>
              {mode === 'view' ? (
                <div className="readonly-field">{formData.emailDomain}</div>
              ) : (
                <input value={formData.emailDomain} onChange={(event) => setFormData((current) => ({ ...current, emailDomain: event.target.value }))} />
              )}
            </div>

            <div className="form-group">
              <label>Status</label>
              {mode === 'view' ? (
                <div className="readonly-field">{formData.status}</div>
              ) : (
                <select value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}>
                  <option value="APPROVED">APPROVED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              )}
            </div>

            <div className="form-group">
              <label>Active</label>
              {mode === 'view' ? (
                <div className="readonly-field">{formData.isActive ? 'Yes' : 'No'}</div>
              ) : (
                <label className="checkbox-row" style={{ marginTop: '12px' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(event) => setFormData((current) => ({ ...current, isActive: event.target.checked }))}
                  />
                  <span>College is active</span>
                </label>
              )}
            </div>

            <div className="form-group">
              <label>Max Students</label>
              {mode === 'view' ? (
                <div className="readonly-field">{formData.maxStudents}</div>
              ) : (
                <input type="number" value={formData.maxStudents} onChange={(event) => setFormData((current) => ({ ...current, maxStudents: Number(event.target.value) }))} />
              )}
            </div>

            <div className="form-group">
              <label>Max Teachers</label>
              {mode === 'view' ? (
                <div className="readonly-field">{formData.maxTeachers}</div>
              ) : (
                <input type="number" value={formData.maxTeachers} onChange={(event) => setFormData((current) => ({ ...current, maxTeachers: Number(event.target.value) }))} />
              )}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Departments</label>
              {mode === 'view' ? (
                <div className="readonly-field">{departmentsText || 'No departments defined'}</div>
              ) : (
                <textarea
                  className="form-textarea"
                  value={departmentsText}
                  onChange={(event) => setDepartmentsText(event.target.value)}
                  placeholder="One department per line"
                />
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Close
            </button>
            {mode === 'edit' ? (
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Saving...' : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
