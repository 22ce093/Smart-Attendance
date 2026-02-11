import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { QrCode, Camera, AlertCircle } from 'lucide-react';

export default function StudentScan() {
    const [scanning, setScanning] = useState(true);
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Mock toggle for UI demonstration since we don't have a real library installed yet
    const toggleScan = () => {
        setScanning(!scanning);
    };

    return (
        <DashboardLayout role="student" userName={localStorage.getItem('name')}>
            <div className="page-header">
                <h1 className="page-title">Scan QR Code</h1>
                <div className="page-subtitle">Mark your attendance by scanning the teacher's QR code</div>
            </div>

            <div className="scanner-page">
                <div className="scanner-container">
                    {scanning ? (
                        <>
                            {/* Placeholder for Camera Feed */}
                            <div className="scanner-placeholder">
                                <Camera size={48} />
                                <p style={{ marginTop: '16px' }}>Camera Feed</p>
                            </div>

                            {/* Overlay UI */}
                            <div className="scanner-overlay">
                                <div className="scan-line"></div>
                            </div>
                        </>
                    ) : (
                        <div className="scanner-placeholder" style={{ background: 'var(--glass-bg)' }}>
                            <QrCode size={48} style={{ opacity: 0.2 }} />
                            <p style={{ marginTop: '16px' }}>Scanning Paused</p>
                        </div>
                    )}
                </div>

                <div className="scanner-instructions">
                    <p>Align the QR code within the frame to mark your attendance.</p>
                </div>

                <button
                    className="btn-primary"
                    style={{ maxWidth: '200px', marginTop: '24px' }}
                    onClick={toggleScan}
                >
                    {scanning ? 'Stop Scanning' : 'Start Scanning'}
                </button>
            </div>
        </DashboardLayout>
    );
}
