const DEVICE_STORAGE_KEY = 'smart-attendance-device-id';

const bytesToHex = (bytes) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const getDeviceId = () => {
  const existingId = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (existingId) {
    return existingId;
  }

  const newId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(DEVICE_STORAGE_KEY, newId);
  return newId;
};

export const getDeviceIdentity = async () => {
  const fingerprintSource = [
    getDeviceId(),
    navigator.userAgent,
    navigator.language,
    window.screen?.width,
    window.screen?.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join('|');

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(fingerprintSource)
  );

  return {
    deviceHash: bytesToHex(new Uint8Array(digest)),
    deviceLabel: `${navigator.platform || 'Device'} / ${navigator.userAgent}`
  };
};

export const extractAttendanceToken = (rawValue = '') => {
  if (!rawValue) {
    return '';
  }

  const trimmedValue = rawValue.trim();

  try {
    const parsedUrl = new URL(trimmedValue);
    return parsedUrl.searchParams.get('token') || '';
  } catch {
    // Ignore URL parsing failures and continue with other formats.
  }

  if (trimmedValue.startsWith('{')) {
    try {
      const parsedJson = JSON.parse(trimmedValue);
      return (
        parsedJson.token ||
        parsedJson.sessionToken ||
        extractAttendanceToken(parsedJson.scanUrl || '')
      );
    } catch {
      return '';
    }
  }

  return trimmedValue.startsWith('SMART_ATTENDANCE::')
    ? trimmedValue.replace('SMART_ATTENDANCE::', '')
    : trimmedValue;
};

export const formatDistance = (distanceMeters) => {
  if (distanceMeters == null) {
    return '';
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(2)} km`;
};
