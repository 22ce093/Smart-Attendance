const QRCode = require('qrcode');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const User = require('../models/User');
const { resolveCollegeContext } = require('../utils/collegeContext');
const {
  equalDepartmentNames,
  normalizeDepartmentName,
  resolveDepartmentValue
} = require('../utils/department');
const {
  createSessionToken,
  generateSessionCode,
  isValidLocation,
  parseLocation
} = require('./AttendanceController');

const buildCollegeScope = (collegeId, collegeName) => ({
  $or: [{ collegeId }, { college: collegeName }]
});

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildDepartmentCondition = (department) => ({
  $regex: `^${escapeRegex(normalizeDepartmentName(department))}$`,
  $options: 'i'
});

const buildScopedQuery = (baseQuery, collegeId, collegeName, department) => {
  const scopedConditions = [buildCollegeScope(collegeId, collegeName)];

  if (department) {
    scopedConditions.push({ department: buildDepartmentCondition(department) });
  }

  return {
    ...baseQuery,
    $and: scopedConditions
  };
};

const resolveTeacherDepartment = (teacher, college) => {
  const teacherDepartment = normalizeDepartmentName(teacher?.department);
  if (!teacherDepartment) {
    return '';
  }

  if (!college?.departments?.length) {
    return teacherDepartment;
  }

  return resolveDepartmentValue(teacherDepartment, college.departments);
};

const isStudentInTeacherScope = (student, collegeId, collegeName, teacherDepartment) => {
  const sameCollege =
    (student.collegeId && String(student.collegeId) === String(collegeId)) ||
    student.college === collegeName;

  if (!sameCollege) {
    return false;
  }

  if (!teacherDepartment) {
    return true;
  }

  return equalDepartmentNames(student.department, teacherDepartment);
};

const getPendingStudents = async (req, res) => {
  try {
    const { user: teacher, college, collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const teacherDepartment = resolveTeacherDepartment(teacher, college);

    const students = await User.find(
      buildScopedQuery(
        {
          role: 'student',
          status: 'PENDING'
        },
        collegeId,
        collegeName,
        teacherDepartment
      )
    )
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const approveStudent = async (req, res) => {
  try {
    const { user: teacher, college, collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const teacherDepartment = resolveTeacherDepartment(teacher, college);
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ message: 'User is not a student' });
    }

    if (!isStudentInTeacherScope(student, collegeId, collegeName, teacherDepartment)) {
      return res.status(403).json({ message: 'You can only approve students from your department and college' });
    }

    student.status = 'APPROVED';
    student.assignedTeacher = req.user.id;
    await student.save();

    res.json({ message: 'Student approved successfully', student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const rejectStudent = async (req, res) => {
  try {
    const { user: teacher, college, collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const teacherDepartment = resolveTeacherDepartment(teacher, college);
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ message: 'User is not a student' });
    }

    if (!isStudentInTeacherScope(student, collegeId, collegeName, teacherDepartment)) {
      return res.status(403).json({ message: 'You can only reject students from your department and college' });
    }

    student.status = 'REJECTED';
    student.assignedTeacher = undefined;
    await student.save();

    res.json({ message: 'Student rejected successfully', student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const getTeacherDashboardStats = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { user: teacher, college, collegeId, collegeName } = await resolveCollegeContext(teacherId);
    const teacherDepartment = resolveTeacherDepartment(teacher, college);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const studentScope = buildScopedQuery(
      {
        role: 'student'
      },
      collegeId,
      collegeName,
      teacherDepartment
    );

    const sessionScope = buildScopedQuery(
      {
        teacher: teacherId
      },
      collegeId,
      collegeName,
      teacherDepartment
    );

    const [pendingRequests, todaySessions, activeSessions, teacherSessions] = await Promise.all([
      User.countDocuments({ ...studentScope, status: 'PENDING' }),
      AttendanceSession.countDocuments({
        ...sessionScope,
        createdAt: { $gte: startOfDay }
      }),
      AttendanceSession.countDocuments({
        ...sessionScope,
        isActive: true,
        expiresAt: { $gt: new Date() },
        endedAt: { $exists: false }
      }),
      AttendanceSession.find(sessionScope).select('_id department collegeId college').lean()
    ]);

    const attendanceCounts = teacherSessions.length
      ? await Attendance.aggregate([
          { $match: { session: { $in: teacherSessions.map((session) => session._id) } } },
          { $group: { _id: '$session', count: { $sum: 1 } } }
        ])
      : [];

    const attendanceCountMap = new Map(
      attendanceCounts.map((entry) => [String(entry._id), entry.count])
    );
    const studentTotalCache = new Map();

    let totalPercentage = 0;
    for (const session of teacherSessions) {
      const sessionDepartment = normalizeDepartmentName(session.department);
      const sessionCollegeId = session.collegeId || collegeId;
      const sessionCollegeName = session.college || collegeName;
      const cacheKey = `${String(sessionCollegeId || '')}:${sessionCollegeName}:${sessionDepartment}`;

      if (!studentTotalCache.has(cacheKey)) {
        const sessionStudentScope = buildScopedQuery(
          {
            role: 'student',
            status: 'APPROVED'
          },
          sessionCollegeId,
          sessionCollegeName,
          sessionDepartment
        );
        const totalStudents = await User.countDocuments(sessionStudentScope);
        studentTotalCache.set(cacheKey, totalStudents);
      }

      const sessionTotal = studentTotalCache.get(cacheKey);
      const sessionPresent = attendanceCountMap.get(String(session._id)) || 0;
      totalPercentage += sessionTotal > 0 ? (sessionPresent / sessionTotal) * 100 : 0;
    }

    const avgAttendance = teacherSessions.length
      ? `${Math.round(totalPercentage / teacherSessions.length)}%`
      : '0%';

    res.json({
      pendingApprovals: pendingRequests,
      todaysClasses: todaySessions,
      activeSession: activeSessions > 0 ? `${activeSessions} active` : 'None',
      avgAttendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const createAttendanceSession = async (req, res) => {
  try {
    const {
      course,
      department,
      durationMinutes = 10,
      allowedRadiusMeters = 120,
      location: rawLocation
    } = req.body;

    const normalizedCourse = String(course || '').trim();
    const requestedDepartment = normalizeDepartmentName(department);

    if (!normalizedCourse) {
      return res.status(400).json({ message: 'Course is required' });
    }

    const { user: teacher, college, collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const teacherDepartment = resolveTeacherDepartment(teacher, college);

    if (teacherDepartment && requestedDepartment && !equalDepartmentNames(teacherDepartment, requestedDepartment)) {
      return res.status(403).json({ message: 'You can only start attendance for your own department' });
    }

    let sessionDepartment = requestedDepartment || teacherDepartment;

    if (!sessionDepartment) {
      return res.status(400).json({ message: 'Department is required' });
    }

    if (college.departments?.length) {
      const departmentExists = college.departments.some((item) =>
        equalDepartmentNames(item, sessionDepartment)
      );
      if (departmentExists) {
        sessionDepartment = resolveDepartmentValue(sessionDepartment, college.departments);
      } else if (!teacherDepartment || !equalDepartmentNames(sessionDepartment, teacherDepartment)) {
        return res
          .status(400)
          .json({ message: 'Department must exist in your college before starting attendance' });
      }
    }

    const location = parseLocation(rawLocation);
    if (!isValidLocation(location)) {
      return res.status(400).json({ message: 'Teacher geolocation is required to start attendance' });
    }

    const sessionDuration = Math.min(Math.max(Number(durationMinutes) || 10, 5), 60);
    const radiusMeters = Math.min(Math.max(Number(allowedRadiusMeters) || 120, 25), 500);
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + sessionDuration * 60 * 1000);

    const session = await AttendanceSession.create({
      teacher: req.user.id,
      collegeId,
      college: collegeName,
      department: sessionDepartment,
      course: normalizedCourse,
      sessionCode: generateSessionCode(),
      location,
      allowedRadiusMeters: radiusMeters,
      durationMinutes: sessionDuration,
      startsAt,
      expiresAt
    });

    const sessionToken = createSessionToken(session);
    const requestOrigin = String(req.headers.origin || '').trim();
    const configuredOrigin = String(process.env.APP_ORIGIN || '').trim();
    const defaultOrigin =
      process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173';
    const origin = (requestOrigin || configuredOrigin || defaultOrigin).replace(/\/$/, '');

    if (!origin) {
      return res.status(500).json({
        message: 'APP_ORIGIN is required to generate QR scan links in production'
      });
    }

    const scanUrl = `${origin}/student/scan?token=${encodeURIComponent(sessionToken)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
      margin: 1,
      width: 320
    });

    res.status(201).json({
      message: 'Session created successfully',
      sessionId: session._id,
      sessionCode: session.sessionCode,
      course: session.course,
      department: session.department,
      startTime: session.startsAt,
      expiresAt: session.expiresAt,
      allowedRadiusMeters: session.allowedRadiusMeters,
      durationMinutes: session.durationMinutes,
      qrCodeDataUrl,
      scanUrl,
      sessionToken
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const endAttendanceSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findOne({
      _id: req.params.id,
      teacher: req.user.id
    });

    if (!session) {
      return res.status(404).json({ message: 'Attendance session not found' });
    }

    session.isActive = false;
    session.endedAt = new Date();
    await session.save();

    res.json({ message: 'Attendance session ended successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAttendanceHistory = async (req, res) => {
  try {
    const { user: teacher, college, collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const teacherDepartment = resolveTeacherDepartment(teacher, college);
    const sessionScope = buildScopedQuery(
      { teacher: req.user.id },
      collegeId,
      collegeName,
      teacherDepartment
    );

    const sessions = await AttendanceSession.find(sessionScope)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const attendanceCounts = sessions.length
      ? await Attendance.aggregate([
          { $match: { session: { $in: sessions.map((session) => session._id) } } },
          { $group: { _id: '$session', present: { $sum: 1 } } }
        ])
      : [];

    const presentMap = new Map(attendanceCounts.map((item) => [String(item._id), item.present]));
    const studentCountCache = new Map();

    const history = [];
    for (const session of sessions) {
      const sessionDepartment = normalizeDepartmentName(session.department);
      const sessionCollegeId = session.collegeId || collegeId;
      const sessionCollegeName = session.college || collegeName;
      const cacheKey = `${String(sessionCollegeId || '')}:${sessionCollegeName}:${sessionDepartment}`;

      if (!studentCountCache.has(cacheKey)) {
        const totalStudents = await User.countDocuments(
          buildScopedQuery(
            {
              role: 'student',
              status: 'APPROVED'
            },
            sessionCollegeId,
            sessionCollegeName,
            sessionDepartment
          )
        );
        studentCountCache.set(cacheKey, totalStudents);
      }

      const present = presentMap.get(String(session._id)) || 0;
      const totalStudents = studentCountCache.get(cacheKey) || 0;

      history.push({
        id: session._id,
        date: new Date(session.startsAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        course: session.course,
        department: session.department,
        present,
        total: totalStudents,
        status: session.endedAt || session.expiresAt <= new Date() ? 'Completed' : 'Active'
      });
    }

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const buildStudentAttendanceMap = async ({ teacherId, collegeId, collegeName, teacherDepartment }) => {
  const studentScope = buildScopedQuery(
    {
      role: 'student',
      status: 'APPROVED'
    },
    collegeId,
    collegeName,
    teacherDepartment
  );

  const students = await User.find(studentScope).select('-password');

  const sessionScope = buildScopedQuery(
    { teacher: teacherId },
    collegeId,
    collegeName,
    teacherDepartment
  );
  const sessionIds = await AttendanceSession.find(sessionScope).distinct('_id');
  const totalSessions = sessionIds.length;

  const attendanceCounts = sessionIds.length
    ? await Attendance.aggregate([
        { $match: { session: { $in: sessionIds } } },
        { $group: { _id: '$student', presentCount: { $sum: 1 } } }
      ])
    : [];

  const attendanceMap = new Map(
    attendanceCounts.map((entry) => [String(entry._id), entry.presentCount])
  );

  return students.map((student) => {
    const presentCount = attendanceMap.get(String(student._id)) || 0;
    const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    return {
      ...student.toObject(),
      attendancePct
    };
  });
};

const getMyStudents = async (req, res) => {
  try {
    const { user: teacher, college, collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const teacherDepartment = resolveTeacherDepartment(teacher, college);
    const students = await buildStudentAttendanceMap({
      teacherId: req.user.id,
      collegeId,
      collegeName,
      teacherDepartment
    });
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const getLowAttendanceStudents = async (req, res) => {
  try {
    const { user: teacher, college, collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const teacherDepartment = resolveTeacherDepartment(teacher, college);
    const students = await buildStudentAttendanceMap({
      teacherId: req.user.id,
      collegeId,
      collegeName,
      teacherDepartment
    });
    res.json(students.filter((student) => student.attendancePct < 75));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const getTeacherProfile = async (req, res) => {
  try {
    const { collegeName } = await resolveCollegeContext(req.user.id);
    const user = await User.findById(req.user.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (!user.college) {
      user.college = collegeName;
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  getPendingStudents,
  approveStudent,
  rejectStudent,
  getTeacherDashboardStats,
  createAttendanceSession,
  endAttendanceSession,
  getAttendanceHistory,
  getMyStudents,
  getLowAttendanceStudents,
  getTeacherProfile
};
