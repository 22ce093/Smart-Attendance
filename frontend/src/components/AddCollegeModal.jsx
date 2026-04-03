import { useState } from 'react';
import { X, Save, Building, Mail, Phone, User, Globe, MapPin } from 'lucide-react';
import './Modal.css'; // We'll need some modal styles

export default function AddCollegeModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        university: '',
        emailDomain: '',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        maxStudents: 1000,
        maxTeachers: 50,
        departments: []
    });
    const [newDept, setNewDept] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddDept = (e) => {
        e.preventDefault();
        if (newDept.trim() && !formData.departments.includes(newDept.trim())) {
            setFormData({
                ...formData,
                departments: [...formData.departments, newDept.trim()]
            });
            setNewDept('');
        }
    };

    const handleRemoveDept = (dept) => {
        setFormData({
            ...formData,
            departments: formData.departments.filter(d => d !== dept)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/colleges', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create college');

            if (data.admin?.temporaryPassword) {
                window.alert(`College created successfully. Temporary admin password: ${data.admin.temporaryPassword}`);
            }
            onSuccess(data);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Add New College</h2>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {error && <div className="error-msg">{error}</div>}

                    <div className="form-section">
                        <h3>College Details</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>College Name *</label>
                                <div className="input-with-icon">
                                    <Building size={16} />
                                    <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. CSPIT" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>College Code *</label>
                                <input type="text" name="code" required value={formData.code} onChange={handleChange} placeholder="Unique Code" />
                            </div>
                            <div className="form-group">
                                <label>University *</label>
                                <input type="text" name="university" required value={formData.university} onChange={handleChange} placeholder="Affiliated University" />
                            </div>
                            <div className="form-group">
                                <label>Email Domain *</label>
                                <div className="input-with-icon">
                                    <Globe size={16} />
                                    <input type="text" name="emailDomain" required value={formData.emailDomain} onChange={handleChange} placeholder="@example.edu" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Contact Details</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Contact Person Name *</label>
                                <div className="input-with-icon">
                                    <User size={16} />
                                    <input type="text" name="adminName" required value={formData.adminName} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Contact Email *</label>
                                <div className="input-with-icon">
                                    <Mail size={16} />
                                    <input type="email" name="adminEmail" required value={formData.adminEmail} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Contact Phone *</label>
                                <div className="input-with-icon">
                                    <Phone size={16} />
                                    <input type="tel" name="adminPhone" required value={formData.adminPhone} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Departments</h3>
                        <div className="form-group">
                            <label>Add Department</label>
                            <div className="input-with-button">
                                <input
                                    type="text"
                                    value={newDept}
                                    onChange={(e) => setNewDept(e.target.value)}
                                    placeholder="e.g. Computer Engineering"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddDept(e);
                                        }
                                    }}
                                />
                                <button type="button" onClick={handleAddDept} className="btn-secondary">Add</button>
                            </div>

                            <div className="tags-container">
                                {formData.departments.map((dept, index) => (
                                    <span key={index} className="tag">
                                        {dept}
                                        <button type="button" onClick={() => handleRemoveDept(dept)}><X size={12} /></button>
                                    </span>
                                ))}
                                {formData.departments.length === 0 && <span className="text-muted text-sm">No departments added yet.</span>}
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Limits (Optional)</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Max Students</label>
                                <input type="number" name="maxStudents" value={formData.maxStudents} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Max Teachers</label>
                                <input type="number" name="maxTeachers" value={formData.maxTeachers} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Creating...' : (
                                <>
                                    <Save size={18} />
                                    Create College
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
