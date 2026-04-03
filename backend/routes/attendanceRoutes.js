const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getAttendanceSessionPreview,
  getStudentAttendanceOverview,
  markAttendance
} = require('../controllers/AttendanceController');

const router = express.Router();

const studentOnly = (req, res, next) => {
  if (req.user?.role === 'student') {
    return next();
  }

  return res.status(403).json({ message: 'Only students can access this resource' });
};

router.get('/session', getAttendanceSessionPreview);
router.post('/mark', protect, studentOnly, markAttendance);
router.get('/student/overview', protect, studentOnly, getStudentAttendanceOverview);

module.exports = router;
