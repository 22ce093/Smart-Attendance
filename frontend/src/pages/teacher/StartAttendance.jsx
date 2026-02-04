import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { SectionHeader } from '../../components/DashboardWidgets';
import { QrCode, Clock, Book } from 'lucide-react';
import axios from 'axios';

export default function StartAttendance() {
    const [course, setCourse] = useState('');
    const [department, setDepartment] = useState('');
    const [sessionData, setSessionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/teacher/attendance/start',
                { course, department },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSessionData(res.data);
        } catch (err) {
            setError('Failed to create session. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role="teacher" userName={localStorage.getItem('name')}>
            <div className="page-header">
                <h1 className="page-title">Start Attendance</h1>
                <div className="page-subtitle">Create a QR session for students to scan</div>
            </div>

            <div className="content-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                {!sessionData ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Course Name</label>
                            <div className="input-with-icon" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px' }}>
                                <Book size={20} style={{ color: 'var(--color-text-secondary)', marginRight: '10px' }} />
                                <input
                                    type="text"
                                    placeholder="e.g. Data Structures"
                                    value={course}
                                    onChange={(e) => setCourse(e.target.value)}
                                    required
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', width: '100%', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Department/Class</label>
                            <div className="input-with-icon" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px' }}>
                                <UsersIcon />
                                <input
                                    type="text"
                                    placeholder="e.g. CE-SEM-4"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    required
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', width: '100%', outline: 'none' }}
                                />
                            </div>
                        </div>

                        {error && <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: 'linear-gradient(135deg, var(--color-accent-grad-start), var(--color-accent-grad-end))',
                                color: 'white', border: 'none', padding: '14px', borderRadius: '12px',
                                fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            {loading ? 'Creating...' : (
                                <>
                                    <QrCode size={20} /> Generate QR Code
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="session-generated" style={{ textAlign: 'center' }}>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', display: 'inline-block', marginBottom: '20px' }}>
                            {/* Placeholder for actual QR Code component */}
                            <QrCode size={200} color="#000" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Session Active</h2>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', color: 'var(--color-text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Book size={16} /> {sessionData.course}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> {new Date(sessionData.startTime).toLocaleTimeString()}</div>
                        </div>
                        <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '16px', borderRadius: '12px', color: '#38bdf8' }}>
                            Session ID: <strong>{sessionData.sessionId}</strong>
                        </div>
                        <button
                            onClick={() => setSessionData(null)}
                            style={{ marginTop: '24px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-text-secondary)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            End Session
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

const UsersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-secondary)', marginRight: '10px' }}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);
