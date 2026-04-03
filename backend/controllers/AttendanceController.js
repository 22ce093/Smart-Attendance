const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const User = require('../models/User');
const { equalDepartmentNames, normalizeDepartmentName } = require('../utils/department');

const ATTENDANCE_QR_PURPOSE = 'attendance-session';

const buildCollegeScope = (collegeId, collegeName) => {
  const conditions = [];

  if (collegeId) {
    conditions.push({ collegeId });
  }

  if (collegeName) {
    conditions.push({ college: collegeName });
  }

  if (conditions.length === 0) {
    return {};
  }

  return conditions.length === 1 ? conditions[0] : { $or: conditions };
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildDepartmentCondition = (department) => ({
  $regex: `^${escapeRegex(normalizeDepartmentName(department))}$`,
  $options: 'i'
});

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceMeters = (from, to) => {
  const earthRadius = 6371000;
  const latDistance = toRadians(to.latitude - from.latitude);
  const lngDistance = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(lngDistance / 2) *
      Math.sin(lngDistance / 2);

  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const generateSessionCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

const createSessionToken = (session) =>
  jwt.sign(
    {
      purpose: ATTENDANCE_QR_PURPOSE,
      sessionId: session._id.toString(),
      sessionCode: session.sessionCode
    },
    process.env.JWT_SECRET,
    { expiresIn: `${session.durationMinutes}m` }
  );

const verifySessionToken = (sessionToken) => {
  const payload = jwt.verify(sessionToken, process.env.JWT_SECRET);

  if (payload.purpose !== ATTENDANCE_QR_PURPOSE) {
    throw new Error('Invalid attendance QR token');
  }

  return payload;
};

const parseLocation = (rawLocation = {}) => ({
  latitude: Number(rawLocation.latitude),
  longitude: Number(rawLocation.longitude),
  accuracy: rawLocation.accuracy != null ? Number(rawLocation.accuracy) : undefined
});

const isValidLocation = (location) =>
  Number.isFinite(location.latitude) &&
  Number.isFinite(location.longitude) &&
  location.latitude >= -90 &&
  location.latitude <= 90 &&
  location.longitude >= -180 &&
  location.longitude <= 180;

const getSessionPreviewPayload = (session) => ({
  sessionId: session._id,
  sessionCode: session.sessionCode,
  course: session.course,
  department: session.department,
  teacherId: session.teacher,
  startsAt: session.startsAt,
  expiresAt: session.expiresAt,
  allowedRadiusMeters: session.allowedRadiusMeters,
  isActive: session.isActive && !session.endedAt && session.expiresAt > new Date()
});

const getAttendanceSessionPreview = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Attendance token is required' });
    }

    const payload = verifySessionToken(token);
    const session = await AttendanceSession.findById(payload.sessionId)
      .populate('teacher', 'name email');

    if (!session) {
      return res.status(404).json({ message: 'Attendance session not found' });
    }

    if (payload.sessionCode !== session.sessionCode) {
      return res.status(400).json({ message: 'Attendance QR is invalid or expired' });
    }

    res.json({
      ...getSessionPreviewPayload(session),
      teacher: session.teacher
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'TokenExpiredError') {
      return res.status(410).json({ message: 'Attendance QR has expired' });
    }
    res.status(400).json({ message: 'Attendance QR is invalid or expired' });
  }
};

const markAttendance = async (req, res) => {
  try {
    const { sessionToken, deviceHash, deviceLabel, location: rawLocation } = req.body;

    if (!sessionToken || !deviceHash) {
      return res.status(400).json({ message: 'Session token and device identity are required' });
    }

    const location = parseLocation(rawLocation);
    if (!isValidLocation(location)) {
      return res.status(400).json({ message: 'Valid geolocation is required to mark attendance' });
    }

    const payload = verifySessionToken(sessionToken);
    const session = await AttendanceSession.findById(payload.sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Attendance session not found' });
    }

    if (payload.sessionCode !== session.sessionCode) {
      return res.status(400).json({ message: 'Attendance QR is invalid or expired' });
    }

    if (!session.isActive || session.endedAt || session.expiresAt <= new Date()) {
      return res.status(410).json({ message: 'Attendance session has expired' });
    }

    const student = await User.findById(req.user.id).select(
      '+attendanceDeviceHash +attendanceDeviceLabel +attendanceDeviceBoundAt'
    );

    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can mark attendance' });
    }

    if (student.status !== 'APPROVED') {
      return res.status(403).json({ message: 'Your account must be approved before marking attendance' });
    }

    const sameCollegeById =
      session.collegeId &&
      student.collegeId &&
      String(session.collegeId) === String(student.collegeId);
    const sameCollegeByName = session.college && student.college && session.college === student.college;

    if ((session.collegeId || session.college) && !sameCollegeById && !sameCollegeByName) {
      return res.status(403).json({ message: 'This attendance session belongs to a different college' });
    }

    if (!equalDepartmentNames(student.department, session.department)) {
      return res.status(403).json({ message: 'This attendance session is not assigned to your department/class' });
    }

    if (student.attendanceDeviceHash && student.attendanceDeviceHash !== deviceHash) {
      return res.status(403).json({
        message: 'Attendance can only be marked from your registered device'
      });
    }

    const distanceMeters = calculateDistanceMeters(session.location, location);
    if (distanceMeters > session.allowedRadiusMeters) {
      return res.status(403).json({
        message: `You are ${distanceMeters}m away from the class. Move within ${session.allowedRadiusMeters}m to continue.`
      });
    }

    const existingAttendance = await Attendance.findOne({
      session: session._id,
      student: student._id
    });

    if (existingAttendance) {
      return res.status(409).json({ message: 'Attendance is already marked for this session' });
    }

    const existingDeviceUsage = await Attendance.findOne({
      session: session._id,
      deviceHash
    }).select('student');

    if (existingDeviceUsage) {
      return res.status(409).json({
        message: 'This device has already been used to mark attendance for the session'
      });
    }

    const attendance = await Attendance.create({
      session: session._id,
      student: student._id,
      teacher: session.teacher,
      date: new Date(),
      status: 'PRESENT',
      collegeId: session.collegeId,
      department: session.department,
      course: session.course,
      markedBy: session.teacher,
      deviceHash,
      deviceLabel,
      location,
      sessionLocation: {
        latitude: session.location.latitude,
        longitude: session.location.longitude
      },
      distanceMeters,
      verification: 'VERIFIED'
    });

    if (!student.attendanceDeviceHash) {
      student.attendanceDeviceHash = deviceHash;
      student.attendanceDeviceLabel = deviceLabel;
      student.attendanceDeviceBoundAt = new Date();
      await student.save();
    }

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendanceId: attendance._id,
      course: attendance.course,
      department: attendance.department,
      distanceMeters,
      markedAt: attendance.createdAt
    });
  } catch (error) {
    console.error(error);

    if (error.name === 'TokenExpiredError') {
      return res.status(410).json({ message: 'Attendance QR has expired' });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: 'Attendance already exists for this student or device' });
    }

    res.status(500).json({ message: 'Unable to mark attendance right now' });
  }
};

const getStudentAttendanceOverview = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);

    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can access this overview' });
    }

    if (!student.department) {
      return res.status(400).json({ message: 'Student department information is missing' });
    }

    const sessionScope = buildCollegeScope(student.collegeId, student.college);
    if (!Object.keys(sessionScope).length) {
      return res.status(400).json({ message: 'Student college information is missing' });
    }

    const sessionFilter = {
      ...sessionScope,
      department: buildDepartmentCondition(student.department)
    };

    const attendanceFilter = {
      student: student._id,
      verification: 'VERIFIED',
      department: buildDepartmentCondition(student.department)
    };

    if (student.collegeId) {
      attendanceFilter.collegeId = student.collegeId;
    }

    const [totalSessions, presentCount, activeSessions, recentAttendance] = await Promise.all([
      AttendanceSession.countDocuments(sessionFilter),
      Attendance.countDocuments(attendanceFilter),
      AttendanceSession.find({
        ...sessionFilter,
        isActive: true,
        endedAt: { $exists: false },
        expiresAt: { $gt: new Date() }
      })
        .sort({ expiresAt: 1 })
        .limit(3)
        .select('course expiresAt startsAt'),
      Attendance.find(attendanceFilter)
        .sort({ createdAt: -1 })
        .limit(6)
        .select('course department status createdAt distanceMeters')
    ]);

    const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
    const lastAttendance = recentAttendance[0]?.createdAt || null;

    res.json({
      student: {
        name: student.name,
        email: student.email,
        department: student.department,
        college: student.college,
        status: student.status
      },
      stats: {
        attendanceRate,
        totalSessions,
        presentCount,
        activeSessions: activeSessions.length,
        lastAttendance
      },
      activeSessions,
      recentAttendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load student attendance overview' });
  }
};

module.exports = {
  ATTENDANCE_QR_PURPOSE,
  createSessionToken,
  generateSessionCode,
  getAttendanceSessionPreview,
  getSessionPreviewPayload,
  getStudentAttendanceOverview,
  markAttendance,
  parseLocation,
  isValidLocation,
  calculateDistanceMeters
};
