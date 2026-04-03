const express = require('express');
const router = express.Router();
const {
  getPendingCollegeAdmins,
  approveCollegeAdmin,
  rejectCollegeAdmin,
  toggleUserStatus,
  getPendingTeachers,
  approveUser,
  rejectUser,
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getCollegeTeachers,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/adminController');
const {
  addCollege,
  getColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
  getDashboardStats: getSuperAdminDashboardStats,
  getCollegeDepartments,
  addCollegeDepartment,
  renameCollegeDepartment,
  deleteCollegeDepartment
} = require('../controllers/collegeController');
const {
  getCollegeDashboardStats,
  getApprovalRequests,
  getDepartmentSummary,
  getRecentActivity
} = require('../controllers/collegeDashboardController');
const { protect } = require('../middleware/authMiddleware');

const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }

  return res.status(401).json({ message: 'Not authorized as Super Admin' });
};

const collegeAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'college_admin') {
    return next();
  }

  return res.status(401).json({ message: 'Not authorized as College Admin' });
};

// Super admin
router.get('/pending-college-admins', protect, superAdminOnly, getPendingCollegeAdmins);
router.post('/approve-college-admin/:id', protect, superAdminOnly, approveCollegeAdmin);
router.post('/reject-college-admin/:id', protect, superAdminOnly, rejectCollegeAdmin);
router.get('/dashboard-stats', protect, superAdminOnly, getSuperAdminDashboardStats);
router.get('/all-users', protect, superAdminOnly, getAllUsers);
router.post('/toggle-status/:id', protect, superAdminOnly, toggleUserStatus);

router.post('/colleges', protect, superAdminOnly, addCollege);
router.get('/colleges', protect, superAdminOnly, getColleges);

// College admin
router.get('/pending-teachers', protect, collegeAdminOnly, getPendingTeachers);
router.post('/approve/:id', protect, collegeAdminOnly, approveUser);
router.post('/reject/:id', protect, collegeAdminOnly, rejectUser);
router.post('/create-user', protect, collegeAdminOnly, createUser);
router.get('/users', protect, collegeAdminOnly, getAllUsers);
router.put('/users/:id', protect, collegeAdminOnly, updateUser);
router.delete('/users/:id', protect, collegeAdminOnly, deleteUser);
router.get('/teachers', protect, collegeAdminOnly, getCollegeTeachers);

router.get('/courses', protect, collegeAdminOnly, getCourses);
router.post('/courses', protect, collegeAdminOnly, createCourse);
router.put('/courses/:id', protect, collegeAdminOnly, updateCourse);
router.delete('/courses/:id', protect, collegeAdminOnly, deleteCourse);

router.get('/colleges/departments', protect, collegeAdminOnly, getCollegeDepartments);
router.post('/colleges/departments', protect, collegeAdminOnly, addCollegeDepartment);
router.put('/colleges/departments', protect, collegeAdminOnly, renameCollegeDepartment);
router.delete('/colleges/departments/:name', protect, collegeAdminOnly, deleteCollegeDepartment);

router.get('/college-dashboard-stats', protect, collegeAdminOnly, getCollegeDashboardStats);
router.get('/approval-requests', protect, collegeAdminOnly, getApprovalRequests);
router.get('/department-summary', protect, collegeAdminOnly, getDepartmentSummary);
router.get('/recent-activity', protect, collegeAdminOnly, getRecentActivity);

router.get('/colleges/:id', protect, superAdminOnly, getCollegeById);
router.put('/colleges/:id', protect, superAdminOnly, updateCollege);
router.delete('/colleges/:id', protect, superAdminOnly, deleteCollege);

module.exports = router;
