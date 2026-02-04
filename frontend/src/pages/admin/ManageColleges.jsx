import { useState, useEffect } from 'react';
import AddCollegeModal from '../../components/AddCollegeModal';
import ViewEditCollegeModal from '../../components/ViewEditCollegeModal';
import ConfirmModal from '../../components/ConfirmModal';
import { SectionHeader } from '../../components/DashboardWidgets';
import { Edit, Trash2, Eye, UserX, UserCheck, Plus, MoreVertical } from 'lucide-react';
import './ManageColleges.css';

export default function ManageColleges() {
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalCollege, setModalCollege] = useState(null);
    const [modalMode, setModalMode] = useState('view'); // 'view' or 'edit'
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchColleges();
    }, [refreshTrigger]);

    const fetchColleges = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/colleges', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch colleges');

            setColleges(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (college) => {
        setModalCollege(college);
        setModalMode('view');
    };

    const handleEdit = (college) => {
        setModalCollege(college);
        setModalMode('edit');
    };

    const handleDelete = (id) => {
        setDeleteTargetId(id);
        setShowConfirmDelete(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/colleges/${deleteTargetId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to delete');
            }
            setShowConfirmDelete(false);
            setDeleteTargetId(null);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/colleges/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus, isActive: newStatus === 'APPROVED' })
            });
            if (!res.ok) throw new Error('Failed to update status');

            // Refresh list
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Manage Colleges</h1>
                    <div className="page-subtitle">View and manage all registered institutions</div>
                </div>
                <button className="btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    Add College
                </button>
            </div>

            {error && <div className="error-msg">{error}</div>}
            {loading ? <div className="loading-spinner">Loading...</div> : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>College Name</th>
                                <th>Code</th>
                                <th>Status</th>
                                <th>Admin</th>
                                <th>Created Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {colleges.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="empty-state">No colleges found. Add one to get started.</td>
                                </tr>
                            ) : colleges.map(college => (
                                <tr key={college._id}>
                                    <td>
                                        <div className="college-name">{college.name}</div>
                                        <div className="college-uni">{college.university}</div>
                                    </td>
                                    <td><span className="badge-code">{college.code}</span></td>
                                    <td>
                                        <span className={`status-badge ${college.status.toLowerCase()}`}>
                                            {college.status}
                                        </span>
                                    </td>
                                    <td>
                                        {college.collegeAdmin ? (
                                            <div className="admin-info">
                                                <div className="admin-name">{college.collegeAdmin.name}</div>
                                                <div className="admin-email">{college.collegeAdmin.email}</div>
                                            </div>
                                        ) : <span className="text-muted">No Admin</span>}
                                    </td>
                                    <td>{new Date(college.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button title="View Details" className="icon-btn-sm view" onClick={() => handleViewDetails(college)}><Eye size={16} /></button>
                                            <button title="Edit" className="icon-btn-sm edit" onClick={() => handleEdit(college)}><Edit size={16} /></button>
                                            <button
                                                title={college.status === 'APPROVED' ? 'Suspend' : 'Activate'}
                                                className={`icon-btn-sm ${college.status === 'APPROVED' ? 'suspend' : 'activate'}`}
                                                onClick={() => handleToggleStatus(college._id, college.status)}
                                            >
                                                {college.status === 'APPROVED' ? <UserX size={16} /> : <UserCheck size={16} />}
                                            </button>
                                            <button
                                                title="Delete"
                                                className="icon-btn-sm delete"
                                                onClick={() => handleDelete(college._id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showAddModal && (
                <AddCollegeModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setRefreshTrigger(prev => prev + 1);
                        setShowAddModal(false);
                    }}
                />
            )}

            {modalCollege && (
                <ViewEditCollegeModal
                    college={modalCollege}
                    mode={modalMode}
                    onClose={() => setModalCollege(null)}
                    onSaved={() => setRefreshTrigger(prev => prev + 1)}
                />
            )}

            {showConfirmDelete && (
                <ConfirmModal
                    title="Delete College"
                    message="Are you sure you want to delete this college? This action cannot be undone."
                    onConfirm={confirmDelete}
                    onCancel={() => { setShowConfirmDelete(false); setDeleteTargetId(null); }}
                />
            )}
        </>
    );
}
