const express = require('express');
const router = express.Router();
const { getPendingStudents, approveStudent, rejectStudent } = require('../controllers/teacherController');
const { protect } = require('../middleware/authMiddleware'); // Assuming we have protect middleware

// Middleware to ensure user is teacher or admin
const teacherOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a teacher' });
  }
};

router.get('/pending', protect, teacherOnly, getPendingStudents);
router.post('/approve/:id', protect, teacherOnly, approveStudent);
router.post('/reject/:id', protect, teacherOnly, rejectStudent);

// New Routes
const { 
  getTeacherDashboardStats, 
  createAttendanceSession, 
  getAttendanceHistory, 
  getMyStudents, 
  getLowAttendanceStudents,
  getTeacherProfile 
} = require('../controllers/teacherController');

router.get('/dashboard-stats', protect, teacherOnly, getTeacherDashboardStats);
router.post('/attendance/start', protect, teacherOnly, createAttendanceSession);
router.get('/attendance/history', protect, teacherOnly, getAttendanceHistory);
router.get('/students', protect, teacherOnly, getMyStudents);
router.get('/students/low-attendance', protect, teacherOnly, getLowAttendanceStudents);
router.get('/profile', protect, teacherOnly, getTeacherProfile);

module.exports = router;
