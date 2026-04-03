import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Book,
  Clock3,
  Crosshair,
  Link as LinkIcon,
  MapPin,
  QrCode,
  ShieldCheck
} from 'lucide-react';

const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported on this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
  });

export default function StartAttendance() {
  const [form, setForm] = useState({
    course: '',
    department: localStorage.getItem('department') || '',
    durationMinutes: 10,
    allowedRadiusMeters: 120
  });
  const [departmentLocked, setDepartmentLocked] = useState(false);
  const [teacherLocation, setTeacherLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [copyState, setCopyState] = useState('');
  const [now, setNow] = useState(Date.now());

  const sessionCountdown = useMemo(() => {
    if (!sessionData?.expiresAt) {
      return '';
    }

    const remainingMs = new Date(sessionData.expiresAt).getTime() - now;
    if (remainingMs <= 0) {
      return 'Expired';
    }

    const totalMinutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    return `${totalMinutes}:${String(seconds).padStart(2, '0')} left`;
  }, [sessionData, now]);

  const isSessionExpired =
    sessionData?.expiresAt ? new Date(sessionData.expiresAt).getTime() <= now : false;

  useEffect(() => {
    if (!sessionData?.expiresAt) {
      return undefined;
    }

    setNow(Date.now());
    const countdownInterval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(countdownInterval);
  }, [sessionData?.expiresAt]);

  useEffect(() => {
    let mounted = true;

    const loadTeacherDefaults = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }

        const response = await fetch('/api/teacher/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!mounted) {
          return;
        }

        if (data.department) {
          setForm((current) => ({ ...current, department: data.department }));
          setDepartmentLocked(true);
        }
      } catch (requestError) {
        console.error(requestError);
      }
    };

    loadTeacherDefaults();
    captureLocation();

    return () => {
      mounted = false;
    };
  }, []);

  const captureLocation = async () => {
    setLocating(true);
    setLocationError('');

    try {
      const position = await getCurrentPosition();
      setTeacherLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    } catch (captureError) {
      console.error(captureError);
      setLocationError(captureError.message || 'Unable to capture your location.');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!teacherLocation) {
      setLoading(false);
      setError('Capture the classroom location before creating a QR session.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/attendance/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          location: teacherLocation
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create attendance session.');
      }

      setSessionData(data);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to create attendance session.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!sessionData?.sessionId) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/teacher/attendance/${sessionData.sessionId}/end`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (requestError) {
      console.error(requestError);
    } finally {
      setSessionData(null);
    }
  };

  const copyScanLink = async () => {
    if (!sessionData?.scanUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(sessionData.scanUrl);
      setCopyState('Link copied');
      window.setTimeout(() => setCopyState(''), 2500);
    } catch (copyError) {
      console.error(copyError);
      setCopyState('Copy failed');
    }
  };

  return (
    <DashboardLayout role="teacher" userName={localStorage.getItem('name')}>
      <div className="page-header">
        <h1 className="page-title">Start Attendance</h1>
        <div className="page-subtitle">
          Launch a secure QR session with classroom geolocation and single-device validation.
        </div>
      </div>

      <div className="attendance-builder">
        <div className="content-card form-card attendance-form-card">
          {!sessionData ? (
            <form onSubmit={handleSubmit} className="attendance-form-grid">
              <div className="form-group">
                <label className="form-label">Course Name</label>
                <div className="input-group">
                  <Book size={20} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Data Structures"
                    value={form.course}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, course: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Department / Class</label>
                <div className="input-group">
                  <ShieldCheck size={20} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. CE-SEM-4"
                    value={form.department}
                    disabled={departmentLocked}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, department: event.target.value }))
                    }
                    required
                  />
                </div>
                {departmentLocked ? (
                  <p className="muted-copy">Department is locked to your teacher profile.</p>
                ) : null}
              </div>

              <div className="form-row-grid">
                <div className="form-group">
                  <label className="form-label">Session Time (minutes)</label>
                  <div className="input-group">
                    <Clock3 size={20} className="input-icon" />
                    <input
                      type="number"
                      min="5"
                      max="60"
                      className="form-input"
                      value={form.durationMinutes}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          durationMinutes: event.target.value
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Allowed Radius (meters)</label>
                  <div className="input-group">
                    <Crosshair size={20} className="input-icon" />
                    <input
                      type="number"
                      min="25"
                      max="500"
                      className="form-input"
                      value={form.allowedRadiusMeters}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          allowedRadiusMeters: event.target.value
                        }))
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="location-panel">
                <div>
                  <div className="location-label">
                    <MapPin size={16} />
                    Classroom Location Lock
                  </div>
                  <p className="location-copy">
                    Students must be inside this radius, otherwise the backend rejects the attendance.
                  </p>
                  {teacherLocation && (
                    <p className="location-meta">
                      Accuracy: {Math.round(teacherLocation.accuracy || 0)} m
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-secondary action-btn"
                  onClick={captureLocation}
                  disabled={locating}
                >
                  {locating ? 'Capturing...' : teacherLocation ? 'Refresh location' : 'Use current location'}
                </button>
              </div>

              {(locationError || error) && (
                <div className="error-msg">{locationError || error}</div>
              )}

              <button type="submit" className="btn-primary" disabled={loading || locating}>
                {loading ? 'Creating secure session...' : 'Generate Secure QR'}
              </button>
            </form>
          ) : (
            <div className="session-generated">
              <div className="qr-preview-card">
                <img src={sessionData.qrCodeDataUrl} alt="Attendance QR code" className="qr-preview-image" />
              </div>

              <div className="session-details-grid">
                <div className="session-detail-pill">
                  <Book size={16} />
                  <span>{sessionData.course}</span>
                </div>
                <div className="session-detail-pill">
                  <ShieldCheck size={16} />
                  <span>{sessionData.department}</span>
                </div>
                <div className="session-detail-pill">
                  <Clock3 size={16} />
                  <span>{sessionCountdown}</span>
                </div>
                <div className="session-detail-pill">
                  <Crosshair size={16} />
                  <span>{sessionData.allowedRadiusMeters}m radius</span>
                </div>
              </div>

              <div className="session-callout">
                <strong>Session Code:</strong> {sessionData.sessionCode}
              </div>

              {isSessionExpired ? (
                <div className="error-msg">Session expired. Start a new attendance session for more scans.</div>
              ) : null}

              <div className="session-instructions">
                <p>Students can scan this with the app camera or their phone camera.</p>
                <p>Each approved student can submit only once from one bound device inside the allowed radius.</p>
              </div>

              <div className="session-actions">
                <button className="btn-secondary action-btn" onClick={copyScanLink}>
                  <LinkIcon size={16} />
                  Copy scan link
                </button>
                <button className="btn-secondary action-btn" onClick={handleEndSession}>
                  End session
                </button>
              </div>

              {copyState && <div className="success-msg">{copyState}</div>}
            </div>
          )}
        </div>

        <div className="content-card attendance-side-card">
          <div className="attendance-side-header">
            <QrCode size={22} />
            <h2>Security Rules</h2>
          </div>
          <ul className="attendance-rules">
            <li>The QR expires automatically after the selected session time.</li>
            <li>The first successful device becomes the student's registered attendance device.</li>
            <li>The backend blocks duplicate attempts from the same student or the same phone.</li>
            <li>Location is verified server-side using teacher and student coordinates.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
