const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const ClassModel = require('../models/Class');
const User = require('../models/User');
const { resolveCollegeContext } = require('../utils/collegeContext');
const { normalizeDepartmentName, resolveDepartmentValue } = require('../utils/department');

const createCollegeScope = (collegeId, collegeName) => ({
  $or: [{ collegeId }, { college: collegeName }]
});

const formatTimestamp = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const getCollegeDashboardStats = async (req, res) => {
  try {
    const { college, collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const scope = createCollegeScope(collegeId, collegeName);

    const [totalTeachers, totalStudents, pendingTeachers, pendingStudents, todayAttendanceCount] =
      await Promise.all([
        User.countDocuments({ ...scope, role: 'teacher', status: 'APPROVED' }),
        User.countDocuments({ ...scope, role: 'student', status: 'APPROVED' }),
        User.countDocuments({ ...scope, role: 'teacher', status: 'PENDING' }),
        User.countDocuments({ ...scope, role: 'student', status: 'PENDING' }),
        Attendance.countDocuments({
          collegeId,
          date: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(24, 0, 0, 0))
          },
          status: 'PRESENT'
        })
      ]);

    const attendancePercentage = totalStudents > 0 ? Math.round((todayAttendanceCount / totalStudents) * 100) : 0;

    res.json({
      totalDepartments: (college.departments || []).length,
      totalTeachers,
      totalStudents,
      pendingApprovals: pendingTeachers + pendingStudents,
      attendancePercentage,
      pendingDetails: {
        teachers: pendingTeachers,
        students: pendingStudents
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: error.message || 'Server error fetching dashboard stats' });
  }
};

const getApprovalRequests = async (req, res) => {
  try {
    const { collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const requests = await User.find({
      ...createCollegeScope(collegeId, collegeName),
      status: 'PENDING',
      role: { $in: ['teacher', 'student'] }
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Approval Requests Error:', error);
    res.status(500).json({ message: error.message || 'Server error fetching requests' });
  }
};

const getDepartmentSummary = async (req, res) => {
  try {
    const { college, collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const scope = createCollegeScope(collegeId, collegeName);

    const [userStats, sessionStats, attendanceStats] = await Promise.all([
      User.aggregate([
        {
          $match: {
            ...scope,
            status: 'APPROVED',
            role: { $in: ['teacher', 'student'] }
          }
        },
        {
          $group: {
            _id: '$department',
            teachers: { $sum: { $cond: [{ $eq: ['$role', 'teacher'] }, 1, 0] } },
            students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } }
          }
        }
      ]),
      AttendanceSession.aggregate([
        { $match: { collegeId } },
        { $group: { _id: '$department', sessionCount: { $sum: 1 } } }
      ]),
      Attendance.aggregate([
        { $match: { collegeId, status: 'PRESENT' } },
        { $group: { _id: '$department', presentCount: { $sum: 1 } } }
      ])
    ]);

    const canonicalDepartment = (value) => {
      const normalizedValue = normalizeDepartmentName(value);
      if (!normalizedValue) {
        return '';
      }

      if (!college.departments?.length) {
        return normalizedValue;
      }

      return resolveDepartmentValue(normalizedValue, college.departments);
    };

    const summaryMap = new Map();
    const ensureSummaryRow = (departmentName) => {
      if (!departmentName) {
        return null;
      }

      if (!summaryMap.has(departmentName)) {
        summaryMap.set(departmentName, {
          name: departmentName,
          teachers: 0,
          students: 0,
          sessionCount: 0,
          presentCount: 0
        });
      }

      return summaryMap.get(departmentName);
    };

    for (const department of college.departments || []) {
      ensureSummaryRow(canonicalDepartment(department));
    }

    for (const entry of userStats) {
      const departmentName = canonicalDepartment(entry._id);
      const row = ensureSummaryRow(departmentName);
      if (!row) {
        continue;
      }

      row.teachers += entry.teachers || 0;
      row.students += entry.students || 0;
    }

    for (const entry of sessionStats) {
      const departmentName = canonicalDepartment(entry._id);
      const row = ensureSummaryRow(departmentName);
      if (!row) {
        continue;
      }

      row.sessionCount += entry.sessionCount || 0;
    }

    for (const entry of attendanceStats) {
      const departmentName = canonicalDepartment(entry._id);
      const row = ensureSummaryRow(departmentName);
      if (!row) {
        continue;
      }

      row.presentCount += entry.presentCount || 0;
    }

    const summary = Array.from(summaryMap.values())
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((row) => ({
        name: row.name,
        teachers: row.teachers,
        students: row.students,
        avgAttendance:
          row.students > 0 && row.sessionCount > 0
            ? Math.round((row.presentCount / (row.students * row.sessionCount)) * 100)
            : 0
      }));

    res.json(summary);
  } catch (error) {
    console.error('Dept Summary Error:', error);
    res.status(500).json({ message: error.message || 'Server error fetching department summary' });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const { collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const scope = createCollegeScope(collegeId, collegeName);

    const [recentUsers, recentSessions, recentCourses] = await Promise.all([
      User.find({
        ...scope,
        role: { $in: ['teacher', 'student'] }
      })
        .select('name role status createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(5),
      AttendanceSession.find({ collegeId })
        .populate('teacher', 'name')
        .select('course department teacher createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      ClassModel.find({ collegeId })
        .select('name department createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const activities = [
      ...recentUsers.map((user) => ({
        id: `user-${user._id}`,
        text:
          user.status === 'PENDING'
            ? `New ${user.role} request from ${user.name}`
            : `${user.role === 'teacher' ? 'Teacher' : 'Student'} ${user.name} updated`,
        time: formatTimestamp(user.updatedAt || user.createdAt),
        date: user.updatedAt || user.createdAt,
        type: user.status === 'PENDING' ? 'warning' : 'success'
      })),
      ...recentSessions.map((session) => ({
        id: `session-${session._id}`,
        text: `${session.teacher?.name || 'Teacher'} started attendance for ${session.course}`,
        time: formatTimestamp(session.createdAt),
        date: session.createdAt,
        type: 'info'
      })),
      ...recentCourses.map((course) => ({
        id: `course-${course._id}`,
        text: `Course ${course.name} added to ${course.department}`,
        time: formatTimestamp(course.createdAt),
        date: course.createdAt,
        type: 'neutral'
      }))
    ]
      .sort((left, right) => new Date(right.date) - new Date(left.date))
      .slice(0, 8);

    res.json(activities);
  } catch (error) {
    console.error('Recent Activity Error:', error);
    res.status(500).json({ message: error.message || 'Server error fetching recent activity' });
  }
};

module.exports = {
  getCollegeDashboardStats,
  getApprovalRequests,
  getDepartmentSummary,
  getRecentActivity
};
