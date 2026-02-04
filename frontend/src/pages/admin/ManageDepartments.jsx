import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ManageColleges.css';

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/admin/colleges/departments', config);
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error('Failed to fetch departments', err);
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="manage-colleges-page">
      <div className="page-header">
        <h1>Manage Departments</h1>
        <p className="page-subtitle">Departments defined for your college</p>
      </div>

      <div className="content-card">
        {error && <div className="error-msg">{error}</div>}
        {departments.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>No departments found for your college.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Department Name</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d, idx) => (
                <tr key={idx}>
                  <td style={{ width: '64px' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 600 }}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
