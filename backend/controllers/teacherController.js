const User = require('../models/User');

// @desc    Get all pending students
// @route   GET /api/teacher/pending
// @access  Private (Teacher/Admin)
const getPendingStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', status: 'PENDING' })
      .select('-password');
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve a student
// @route   POST /api/teacher/approve/:id
// @access  Private (Teacher/Admin)
const approveStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.role !== 'student') {
        return res.status(400).json({ message: 'User is not a student' });
    }

    student.status = 'APPROVED';
    // Optionally assign the confirming teacher
    student.assignedTeacher = req.user.id;
    
    await student.save();

    res.json({ message: 'Student approved successfully', student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject a student
// @route   POST /api/teacher/reject/:id
// @access  Private (Teacher/Admin)
const rejectStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.status = 'REJECTED';
    await student.save();

    res.json({ message: 'Student rejected', student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPendingStudents,
  approveStudent,
  approveStudent,
  rejectStudent
};

// =============================================
// DASHBOARD & ATTENDANCE
// =============================================

// @desc    Get Teacher Dashboard Stats
// @route   GET /api/teacher/dashboard-stats
// @access  Private (Teacher)
const getTeacherDashboardStats = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const teacher = await User.findById(teacherId);

    // 1. Pending Approvals
    const pendingRequests = await User.countDocuments({ 
      role: 'student', 
      status: 'PENDING',
      college: teacher.college // Assuming teacher sees all pending for their college or logic can be stricter
    });

    // 2. Today's Classes (Mock for now, or count distinct sessions created today)
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
    // const classSessionCount = await Attendance.distinct('course', { markedBy: teacherId, date: { $gte: startOfToday } }).length;
    const classSessionCount = 2; // Mock value as sessions aren't fully modeled yet

    // 3. Active Session (Mock)
    const activeSession = "None"; 

    // 4. Avg Attendance (Mock)
    const avgAttendance = "85%";

    res.json({
        pendingApprovals: pendingRequests,
        todaysClasses: classSessionCount,
        activeSession,
        avgAttendance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Start Attendance Session (Mock - creates a record)
// @route   POST /api/teacher/attendance/start
// @access  Private (Teacher)
const createAttendanceSession = async (req, res) => {
    try {
        const { course, department } = req.body;
        
        // Use a temporary Attendance record to signify a session was held
        // In a real QR system, we'd generate a session ID here to pass to frontend
        const sessionToken = Math.random().toString(36).substring(7);

        res.json({
            message: 'Session created successfully',
            sessionId: sessionToken,
            course,
            startTime: new Date()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Attendance History
// @route   GET /api/teacher/attendance/history
// @access  Private (Teacher)
const getAttendanceHistory = async (req, res) => {
    // Mock history data
    const history = [
        { id: 1, date: '2023-10-24', course: 'Data Structures', present: 45, total: 50 },
        { id: 2, date: '2023-10-23', course: 'DBMS', present: 40, total: 52 },
        { id: 3, date: '2023-10-22', course: 'Data Structures', present: 48, total: 50 },
    ];
    res.json(history);
};

// @desc    Get My Students
// @route   GET /api/teacher/students
// @access  Private (Teacher)
const getMyStudents = async (req, res) => {
    try {
        const teacher = await User.findById(req.user.id);
        const students = await User.find({
            role: 'student',
            status: 'APPROVED',
            college: teacher.college,
            department: teacher.department // Assuming filtering by same department
        }).select('-password');
        
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Low Attendance Students
// @route   GET /api/teacher/students/low-attendance
// @access  Private (Teacher)
const getLowAttendanceStudents = async (req, res) => {
    try {
        // In future: Aggregate real attendance data
        // For now: Mock logic or return random subset of MyStudents
        const teacher = await User.findById(req.user.id);
        const students = await User.find({
            role: 'student',
            status: 'APPROVED',
            college: teacher.college,
            department: teacher.department
        }).select('name email phone enrollmentId');

        // Mock: arbitrarily pick first 3 as "low attendance"
        const lowAttendanceList = students.slice(0, 3).map(s => ({
            ...s._doc,
            attendancePct: Math.floor(Math.random() * (74 - 50 + 1)) + 50 // Random 50-74%
        }));

        res.json(lowAttendanceList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Teacher Profile
// @route   GET /api/teacher/profile
// @access  Private (Teacher)
const getTeacherProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
  getPendingStudents,
  approveStudent,
  rejectStudent,
  getTeacherDashboardStats,
  createAttendanceSession,
  getAttendanceHistory,
  getMyStudents,
  getLowAttendanceStudents,
  getTeacherProfile
};
