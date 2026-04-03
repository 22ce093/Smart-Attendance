import { useEffect, useState } from 'react';
import { SectionHeader } from '../../components/DashboardWidgets';

const INITIAL_FORM = {
  name: '',
  code: '',
  description: '',
  semester: '',
  section: '',
  department: '',
  assignedTeacher: '',
  isActive: true
};

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [editingCourseId, setEditingCourseId] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPageData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [coursesRes, departmentsRes, teachersRes] = await Promise.all([
        fetch('/api/admin/courses', { headers }),
        fetch('/api/admin/colleges/departments', { headers }),
        fetch('/api/admin/teachers', { headers })
      ]);

      const [coursesData, departmentsData, teachersData] = await Promise.all([
        coursesRes.json(),
        departmentsRes.json(),
        teachersRes.json()
      ]);

      if (!coursesRes.ok) throw new Error(coursesData.message || 'Failed to load courses');
      if (!departmentsRes.ok) throw new Error(departmentsData.message || 'Failed to load departments');
      if (!teachersRes.ok) throw new Error(teachersData.message || 'Failed to load teachers');

      setCourses(coursesData);
      setDepartments(departmentsData.departments || []);
      setTeachers(teachersData);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const resetForm = () => {
    setEditingCourseId('');
    setForm(INITIAL_FORM);
  };

  const startEdit = (course) => {
    setEditingCourseId(course._id);
    setForm({
      name: course.name || '',
      code: course.code || '',
      description: course.description || '',
      semester: course.semester || '',
      section: course.section || '',
      department: course.department || '',
      assignedTeacher: course.assignedTeacher?._id || '',
      isActive: typeof course.isActive === 'boolean' ? course.isActive : true
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const endpoint = editingCourseId ? `/api/admin/courses/${editingCourseId}` : '/api/admin/courses';
      const method = editingCourseId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          assignedTeacher: form.assignedTeacher || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save course');

      await loadPageData();
      resetForm();
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Delete this course?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete course');

      await loadPageData();
      if (editingCourseId === courseId) {
        resetForm();
      }
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to delete course');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="page-header">
        <h1 className="page-title">Course Management</h1>
        <div className="page-subtitle">Create, assign, and manage course records for your college.</div>
      </div>

      <div className="attendance-builder">
        <div className="content-card">
          <SectionHeader title="Course Catalog" />
          {error ? <div className="error-msg">{error}</div> : null}
          {loading ? <div className="loading-msg">Loading courses...</div> : null}

          {!loading ? (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Department</th>
                    <th>Teacher</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>
                        No courses created yet
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr key={course._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{course.name}</div>
                          <div className="muted-copy">{course.code}</div>
                        </td>
                        <td>{course.department}</td>
                        <td>{course.assignedTeacher?.name || 'Unassigned'}</td>
                        <td>
                          <span className={`status-pill ${course.isActive ? 'success' : 'danger'}`}>
                            {course.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div className="inline-actions">
                            <button className="btn-secondary action-btn" style={{ marginTop: 0 }} onClick={() => startEdit(course)}>
                              Edit
                            </button>
                            <button className="btn-reject" onClick={() => handleDelete(course._id)}>
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
          <SectionHeader title={editingCourseId ? 'Edit Course' : 'Create Course'} />

          <form className="attendance-form-grid" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Course Name</label>
              <input className="form-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Course Code</label>
              <input className="form-input" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-input" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} required>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Teacher</label>
              <select className="form-input" value={form.assignedTeacher} onChange={(event) => setForm((current) => ({ ...current, assignedTeacher: event.target.value }))}>
                <option value="">Unassigned</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} ({teacher.teacherId || teacher.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label className="form-label">Semester</label>
                <input className="form-input" value={form.semester} onChange={(event) => setForm((current) => ({ ...current, semester: event.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <input className="form-input" value={form.section} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              <span>Course is active</span>
            </label>

            <div className="form-actions">
              {editingCourseId ? (
                <button type="button" className="btn-secondary action-btn" style={{ marginTop: 0 }} onClick={resetForm}>
                  Cancel edit
                </button>
              ) : null}
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingCourseId ? 'Update course' : 'Create course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
