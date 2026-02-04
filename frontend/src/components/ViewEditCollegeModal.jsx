import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import './Modal.css';

export default function ViewEditCollegeModal({ college, mode = 'view', onClose, onSaved }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (college) {
            setFormData({
                name: college.name || '',
                code: college.code || '',
                university: college.university || '',
                emailDomain: college.emailDomain || '',
                status: college.status || '',
                isActive: typeof college.isActive === 'boolean' ? college.isActive : true,
                maxStudents: college.maxStudents || 1000,
                maxTeachers: college.maxTeachers || 50
            });
        }
    }, [college]);

    if (!college) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/colleges/${college._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update');
            if (onSaved) onSaved(data);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content small">
                <div className="modal-header">
                    <h2>{mode === 'view' ? 'College Details' : 'Edit College'}</h2>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {error && <div className="error-msg">{error}</div>}

                    <div className="form-grid">
                        <div className="form-group">
                            <label>College Name</label>
                            {mode === 'view' ? (
                                <div className="readonly-field">{formData.name}</div>
                            ) : (
                                <input name="name" value={formData.name} onChange={handleChange} />
                            )}
                        </div>
                        <div className="form-group">
                            <label>Code</label>
                            <div className="readonly-field">{formData.code}</div>
                        </div>
                        <div className="form-group">
                            <label>University</label>
                            {mode === 'view' ? (
                                <div className="readonly-field">{formData.university}</div>
                            ) : (
                                <input name="university" value={formData.university} onChange={handleChange} />
                            )}
                        </div>
                        <div className="form-group">
                            <label>Email Domain</label>
                            <div className="readonly-field">{formData.emailDomain}</div>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <div className="readonly-field">{formData.status}</div>
                        </div>
                        <div className="form-group">
                            <label>Active</label>
                            {mode === 'view' ? (
                                <div className="readonly-field">{formData.isActive ? 'true' : 'false'}</div>
                            ) : (
                                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                            )}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">Close</button>
                        {mode === 'edit' && (
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Saving...' : (
                                    <>
                                        <Save size={16} /> Save Changes
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
