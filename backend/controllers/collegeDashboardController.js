const User = require('../models/User');
const College = require('../models/College');
const Attendance = require('../models/Attendance');

// @desc    Get dashboard KPIs (College Level)
// @route   GET /api/admin/dashboard-stats
// @access  Private (College Admin)
const getCollegeDashboardStats = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Find admin to get their college
    const admin = await User.findById(adminId);
    if (!admin || !admin.college) {
      return res.status(400).json({ message: 'College Admin info not found' });
    }

    const collegeName = admin.college;
    let collegeId = admin.collegeId;

    // If collegeId missing, try to lookup by college name (legacy support)
    let college = null;
    if (collegeId) {
      college = await College.findById(collegeId);
    }
    if (!college && collegeName) {
      college = await College.findOne({ name: collegeName });
      if (college) collegeId = college._id;
    }

    // 1. Total Departments - Fetch from College Model
    const departmentsCount = college ? (college.departments || []).length : 0;

    // 2. Total Teachers
    const totalTeachers = await User.countDocuments({ 
      college: collegeName, 
      role: 'teacher',
      status: 'APPROVED'
    });

    // 3. Total Students
    const totalStudents = await User.countDocuments({ 
      college: collegeName, 
      role: 'student',
      status: 'APPROVED'
    });

    // 4. Pending Approvals
    // Teachers
    const pendingTeachers = await User.countDocuments({
      college: collegeName,
      role: 'teacher',
      status: 'PENDING'
    });
    // Students
    const pendingStudents = await User.countDocuments({
      college: collegeName,
      role: 'student',
      status: 'PENDING'
    });

    // 5. Today's Attendance % (Mock calculation until we have real data)
    // In real scenario: (Present Students / Total Students) * 100
    // Get start and end of today
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendanceCount = await Attendance.countDocuments({
      collegeId: collegeId, // Ideally utilize ID
      date: { $gte: today, $lt: tomorrow },
      status: 'PRESENT'
    });

    // Avoid division by zero
    const attendancePercentage = totalStudents > 0 
      ? Math.round((todayAttendanceCount / totalStudents) * 100) 
      : 0;

    res.json({
      totalDepartments: departmentsCount,
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
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

// @desc    Get Pending Approvals List
// @route   GET /api/admin/approval-requests
// @access  Private (College Admin)
const getApprovalRequests = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.college) {
      return res.status(400).json({ message: 'College info missing' });
    }

    const requests = await User.find({
      college: admin.college,
      status: 'PENDING',
      role: { $in: ['teacher', 'student'] }
    })
    .select('-password')
    .sort({ createdAt: -1 });

    res.json(requests);

  } catch (error) {
    console.error('Approval Requests Error:', error);
    res.status(500).json({ message: 'Server error fetching requests' });
  }
};

// @desc    Get Department Overview
// @route   GET /api/admin/department-summary
// @access  Private (College Admin)
const getDepartmentSummary = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    const collegeName = admin.college;

    // 1. Get defined departments from College model
    // 1. Get defined departments from College model using ID for reliability
    const college = await College.findById(admin.collegeId);
    const definedDepartments = college ? (college.departments || []) : [];

    // 2. Aggregation to get students count per department
    const deptStats = await User.aggregate([
      { 
        $match: { 
          college: collegeName, 
          status: 'APPROVED',
          role: { $in: ['teacher', 'student'] }
        } 
      },
      {
        $group: {
          _id: "$department",
          teachers: { 
            $sum: { $cond: [{ $eq: ["$role", "teacher"] }, 1, 0] } 
          },
          students: { 
            $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] } 
          }
        }
      }
    ]);

    // 3. Merge defined departments with stats
    // Create a map for easy lookup
    const statsMap = deptStats.reduce((acc, curr) => {
      if (curr._id) acc[curr._id] = curr;
      return acc;
    }, {});

    // Combine unique departments (both defined and those found in users - legacy support)
    const allDeptNames = [...new Set([...definedDepartments, ...deptStats.map(d => d._id).filter(Boolean)])];
    
    // Sort alphabetically
    allDeptNames.sort();

    const summary = allDeptNames.map(deptName => {
      const stats = statsMap[deptName] || { teachers: 0, students: 0 };
      return {
        name: deptName,
        teachers: stats.teachers,
        students: stats.students,
        avgAttendance: Math.floor(Math.random() * (95 - 70 + 1)) + 70 // Mock
      };
    });

    res.json(summary);

  } catch (error) {
    console.error('Dept Summary Error:', error);
    res.status(500).json({ message: 'Server error fetching department summary' });
  }
};

// @desc    Get Recent Activity (Mock)
// @route   GET /api/admin/recent-activity
// @access  Private (College Admin)
const getRecentActivity = async (req, res) => {
    // Mock Data - In real app, this would query an ActivityLog model
    const activities = [
        { id: 1, text: "Teacher 'Rahul' approved", time: "2 mins ago", type: "success" },
        { id: 2, text: "QR session created for CE-SEM 4", time: "15 mins ago", type: "info" },
        { id: 3, text: "15 students marked present (10:00 AM)", time: "1 hour ago", type: "neutral" },
        { id: 4, text: "New student registration request", time: "2 hours ago", type: "warning" }
    ];
    
    res.json(activities);
};

module.exports = {
  getCollegeDashboardStats,
  getApprovalRequests,
  getDepartmentSummary,
  getRecentActivity
};
