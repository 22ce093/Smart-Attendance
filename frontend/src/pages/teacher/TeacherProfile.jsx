import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { User, Mail, Phone, Building, Hash } from 'lucide-react';
import axios from 'axios';

export default function TeacherProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/teacher/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <DashboardLayout role="teacher" userName={profile?.name || 'Teacher'}>
            <div className="page-header">
                <h1 className="page-title">My Profile</h1>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="content-card" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

                    {/* Left: Avatar */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-accent-grad-start), var(--color-accent-grad-end))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '3rem', fontWeight: 'bold', color: 'white'
                        }}>
                            {profile?.name?.charAt(0) || 'T'}
                        </div>
                        <div className="badge-blue">Teacher</div>
                    </div>

                    {/* Right: Details */}
                    <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{profile?.name}</h2>
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>{profile?.college}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <DetailItem icon={<Mail size={18} />} label="Email" value={profile?.email} />
                            <DetailItem icon={<Phone size={18} />} label="Phone" value={profile?.phone || 'Not set'} />
                            <DetailItem icon={<Building size={18} />} label="Department" value={profile?.department || 'N/A'} />
                            <DetailItem icon={<Hash size={18} />} label="Teacher ID" value={profile?.teacherId || 'N/A'} />
                        </div>

                        <button className="btn-secondary" style={{ marginTop: '32px', width: '100%' }}>
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

const DetailItem = ({ icon, label, value }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
            {icon} {label}
        </div>
        <div style={{ fontWeight: '500', fontSize: '1rem' }}>{value}</div>
    </div>
);
