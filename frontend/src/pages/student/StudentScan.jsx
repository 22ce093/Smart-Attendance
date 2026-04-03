import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Camera,
  CheckCircle2,
  Crosshair,
  LoaderCircle,
  MapPin,
  ShieldCheck,
  Smartphone,
  TriangleAlert
} from 'lucide-react';
import {
  extractAttendanceToken,
  formatDistance,
  getDeviceIdentity
} from '../../utils/attendance';

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

export default function StudentScan() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessionToken, setSessionToken] = useState(searchParams.get('token') || '');
  const [sessionPreview, setSessionPreview] = useState(null);
  const [deviceIdentity, setDeviceIdentity] = useState(null);
  const [location, setLocation] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [scannerState, setScannerState] = useState('idle');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [now, setNow] = useState(Date.now());
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);

  useEffect(() => {
    let active = true;

    const loadDeviceIdentity = async () => {
      try {
        const identity = await getDeviceIdentity();
        if (active) {
          setDeviceIdentity(identity);
        }
      } catch (identityError) {
        console.error(identityError);
      }
    };

    loadDeviceIdentity();
    refreshLocation();

    return () => {
      active = false;
      stopScanner();
    };
  }, []);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token') || '';
    setSessionToken(tokenFromUrl);
    setAttendanceMarked(false);
  }, [searchParams]);

  const loadSessionPreview = useCallback(async (token, options = {}) => {
    const { silent = false } = options;
    if (!token) {
      setSessionPreview(null);
      return;
    }

    if (!silent) {
      setLoadingPreview(true);
      setFeedback({ type: '', message: '' });
    }

    try {
      const response = await fetch(`/api/attendance/session?token=${encodeURIComponent(token)}`);
      const data = await response.json();

      if (!response.ok) {
        const previewError = new Error(data.message || 'Failed to validate attendance QR.');
        previewError.status = response.status;
        throw previewError;
      }

      setSessionPreview(data);
    } catch (previewError) {
      if (silent) {
        console.error(previewError);
        return;
      }

      console.error(previewError);
      setSessionPreview(null);
      setFeedback({
        type: 'error',
        message: previewError.message || 'Failed to validate attendance QR.'
      });
    } finally {
      if (!silent) {
        setLoadingPreview(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!sessionToken) {
      setSessionPreview(null);
      return;
    }

    loadSessionPreview(sessionToken);
  }, [loadSessionPreview, sessionToken]);

  useEffect(() => {
    if (!sessionPreview?.expiresAt) {
      return undefined;
    }

    setNow(Date.now());
    const countdownInterval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(countdownInterval);
  }, [sessionPreview?.expiresAt]);

  useEffect(() => {
    if (!sessionToken || !sessionPreview?.isActive || attendanceMarked) {
      return undefined;
    }

    const previewRefreshInterval = window.setInterval(() => {
      loadSessionPreview(sessionToken, { silent: true });
    }, 15000);

    return () => window.clearInterval(previewRefreshInterval);
  }, [attendanceMarked, loadSessionPreview, sessionPreview?.isActive, sessionToken]);

  const sessionExpiryMs = sessionPreview?.expiresAt
    ? new Date(sessionPreview.expiresAt).getTime()
    : 0;
  const isSessionActive = Boolean(sessionPreview?.isActive) && sessionExpiryMs > now;
  const sessionCountdown = useMemo(() => {
    if (!sessionPreview?.expiresAt) {
      return '';
    }

    const remainingMs = sessionExpiryMs - now;
    if (remainingMs <= 0) {
      return 'Expired';
    }

    const totalMinutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    return `${totalMinutes}:${String(seconds).padStart(2, '0')} left`;
  }, [now, sessionExpiryMs, sessionPreview?.expiresAt]);

  const refreshLocation = async () => {
    setLocating(true);
    setFeedback((current) => (current.type === 'error' ? { type: '', message: '' } : current));

    try {
      const position = await getCurrentPosition();
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    } catch (locationError) {
      console.error(locationError);
      setFeedback({
        type: 'error',
        message: locationError.message || 'Unable to capture your current location.'
      });
    } finally {
      setLocating(false);
    }
  };

  const stopScanner = () => {
    if (scanLoopRef.current) {
      window.clearInterval(scanLoopRef.current);
      scanLoopRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setScannerState('idle');
  };

  const handleScanResult = (rawValue) => {
    const token = extractAttendanceToken(rawValue);
    if (!token) {
      return;
    }

    stopScanner();
    setSearchParams({ token });
  };

  const startScanner = async () => {
    if (!('BarcodeDetector' in window)) {
      setFeedback({
        type: 'error',
        message: 'This browser does not support in-app QR scanning. Use your phone camera to open the scan link instead.'
      });
      return;
    }

    try {
      setScannerState('starting');
      setFeedback({ type: '', message: '' });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      setScannerState('active');

      scanLoopRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          return;
        }

        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            handleScanResult(codes[0].rawValue || '');
          }
        } catch (scanError) {
          console.error(scanError);
        }
      }, 500);
    } catch (cameraError) {
      console.error(cameraError);
      stopScanner();
      setFeedback({
        type: 'error',
        message: cameraError.message || 'Unable to access your camera.'
      });
    }
  };

  const submitAttendance = async () => {
    if (!sessionToken) {
      setFeedback({ type: 'error', message: 'Scan a valid attendance QR first.' });
      return;
    }

    if (attendanceMarked) {
      setFeedback({ type: 'success', message: 'Attendance already submitted for this session.' });
      return;
    }

    if (!isSessionActive) {
      setFeedback({ type: 'error', message: 'This attendance session is no longer active.' });
      return;
    }

    if (!deviceIdentity) {
      setFeedback({ type: 'error', message: 'Preparing device verification. Try again in a moment.' });
      return;
    }

    if (!location) {
      setFeedback({ type: 'error', message: 'Enable location before marking attendance.' });
      return;
    }

    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionToken,
          deviceHash: deviceIdentity.deviceHash,
          deviceLabel: deviceIdentity.deviceLabel,
          location
        })
      });

      const data = await response.json();
      if (!response.ok) {
        const attendanceError = new Error(data.message || 'Failed to mark attendance.');
        attendanceError.status = response.status;
        throw attendanceError;
      }

      setAttendanceMarked(true);
      setFeedback({
        type: 'success',
        message: `Attendance marked successfully for ${data.course}. Distance verified: ${formatDistance(
          data.distanceMeters
        )}.`
      });
    } catch (submitError) {
      console.error(submitError);

      if (
        submitError.status === 409 &&
        /attendance is already marked for this session/i.test(submitError.message || '')
      ) {
        setAttendanceMarked(true);
      }

      if (submitError.status === 410) {
        await loadSessionPreview(sessionToken, { silent: true });
      }

      setFeedback({
        type: 'error',
        message: submitError.message || 'Failed to mark attendance.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="student" userName={localStorage.getItem('name')}>
      <div className="page-header">
        <h1 className="page-title">Scan Attendance QR</h1>
        <div className="page-subtitle">
          Secure attendance uses your device identity and current classroom location before submitting.
        </div>
      </div>

      <div className="scan-layout">
        <div className="content-card scan-main-card">
          <div className="scanner-container scanner-live">
            {scannerState === 'active' ? (
              <>
                <video ref={videoRef} className="scanner-video" playsInline muted />
                <div className="scanner-overlay">
                  <div className="scan-line"></div>
                </div>
              </>
            ) : (
              <div className="scanner-placeholder">
                {scannerState === 'starting' ? <LoaderCircle size={52} className="spin" /> : <Camera size={48} />}
                <p>{scannerState === 'starting' ? 'Opening camera...' : 'Use the camera or open the scan link directly'}</p>
              </div>
            )}
          </div>

          <div className="scan-actions">
            <button className="btn-primary" onClick={scannerState === 'active' ? stopScanner : startScanner}>
              {scannerState === 'active' ? 'Stop camera scanner' : 'Start camera scanner'}
            </button>
            <button className="btn-secondary action-btn" onClick={refreshLocation} disabled={locating}>
              {locating ? 'Refreshing location...' : 'Refresh my location'}
            </button>
          </div>

          <div className="scanner-instructions">
            <p>Best mobile flow: scan the teacher QR with your phone camera, then tap the secure submit button here.</p>
          </div>
        </div>

        <div className="content-card scan-status-card">
          <div className="scan-status-header">
            <ShieldCheck size={22} />
            <h2>Verification Status</h2>
          </div>

          <div className="verification-item">
            <Smartphone size={18} />
            <div>
              <strong>Device binding</strong>
              <p>{deviceIdentity ? 'Ready for single-device attendance verification.' : 'Preparing device identity...'}</p>
            </div>
          </div>

          <div className="verification-item">
            <MapPin size={18} />
            <div>
              <strong>Live location</strong>
              <p>
                {location
                  ? `Accuracy ${Math.round(location.accuracy || 0)}m`
                  : 'Capture your current classroom location before submitting.'}
              </p>
            </div>
          </div>

          <div className="verification-item">
            <Crosshair size={18} />
            <div>
              <strong>QR validation</strong>
              <p>
                {sessionToken
                  ? isSessionActive
                    ? 'Attendance QR detected and active.'
                    : 'Attendance QR detected but no longer active.'
                  : 'Waiting for a valid QR token.'}
              </p>
            </div>
          </div>

          <div className="session-preview-panel">
            {loadingPreview ? (
              <div className="loading-msg">Validating QR session...</div>
            ) : sessionPreview ? (
              <>
                <div className="session-preview-title">{sessionPreview.course}</div>
                <p>{sessionPreview.department}</p>
                <p>Teacher: {sessionPreview.teacher?.name || 'Unknown'}</p>
                <p>
                  Expires: {new Date(sessionPreview.expiresAt).toLocaleTimeString('en-IN')} ({sessionCountdown})
                </p>
                {!isSessionActive ? (
                  <div className="error-msg" style={{ marginTop: '12px' }}>
                    This QR session is expired or already ended.
                  </div>
                ) : null}
                {attendanceMarked ? (
                  <div className="success-msg" style={{ marginTop: '12px' }}>
                    Attendance already submitted for this session.
                  </div>
                ) : null}
                <button
                  className="btn-primary"
                  onClick={submitAttendance}
                  disabled={submitting || locating || !isSessionActive || attendanceMarked}
                >
                  {attendanceMarked
                    ? 'Attendance submitted'
                    : submitting
                      ? 'Submitting attendance...'
                      : 'Mark attendance'}
                </button>
              </>
            ) : (
              <p className="muted-copy">Scan a QR or open a teacher scan link to load the session details here.</p>
            )}
          </div>

          {feedback.message && (
            <div className={feedback.type === 'success' ? 'success-banner' : 'error-banner'}>
              {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <TriangleAlert size={18} />}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
