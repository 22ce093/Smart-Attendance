const express = require('express');
const router = express.Router();
const { 
  // Super Admin
  getPendingCollegeAdmins, 
  approveCollegeAdmin, 
  rejectCollegeAdmin,
  toggleUserStatus,
  // College Admin
  getPendingTeachers, 
  approveUser, 
  rejectUser, 
  createUser, 
  getAllUsers 
} = require('../controllers/adminController');
const {
  addCollege,
  getColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
  getDashboardStats: getSuperAdminDashboardStats,
  getCollegeDepartments
} = require('../controllers/collegeController');
const {
  getCollegeDashboardStats,
  getApprovalRequests,
  getDepartmentSummary,
  getRecentActivity
} = require('../controllers/collegeDashboardController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to ensure user is Super Admin
const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as Super Admin' });
  }
};

// Middleware to ensure user is College Admin
const collegeAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'college_admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as College Admin' });
  }
};

// ===== Super Admin Routes =====
router.get('/pending-college-admins', protect, superAdminOnly, getPendingCollegeAdmins);
router.post('/approve-college-admin/:id', protect, superAdminOnly, approveCollegeAdmin);
router.post('/reject-college-admin/:id', protect, superAdminOnly, rejectCollegeAdmin);

// ===== College Management (Super Admin) =====
router.post('/colleges', protect, superAdminOnly, addCollege);
router.get('/colleges', protect, superAdminOnly, getColleges);
// Specific route for college admin to fetch their college's departments
router.get('/colleges/departments', protect, collegeAdminOnly, getCollegeDepartments);
router.get('/colleges/:id', protect, superAdminOnly, getCollegeById);
router.put('/colleges/:id', protect, superAdminOnly, updateCollege);
router.delete('/colleges/:id', protect, superAdminOnly, deleteCollege);
router.get('/dashboard-stats', protect, superAdminOnly, getSuperAdminDashboardStats);
router.get('/all-users', protect, superAdminOnly, getAllUsers);
router.post('/toggle-status/:id', protect, superAdminOnly, toggleUserStatus);

// ===== College Admin Routes =====
router.get('/pending-teachers', protect, collegeAdminOnly, getPendingTeachers);
router.post('/approve/:id', protect, collegeAdminOnly, approveUser);
router.post('/reject/:id', protect, collegeAdminOnly, rejectUser);
router.post('/create-user', protect, collegeAdminOnly, createUser);
router.get('/users', protect, collegeAdminOnly, getAllUsers);

// ===== College Dashboard Routes =====
router.get('/college-dashboard-stats', protect, collegeAdminOnly, getCollegeDashboardStats);
router.get('/approval-requests', protect, collegeAdminOnly, getApprovalRequests);
router.get('/department-summary', protect, collegeAdminOnly, getDepartmentSummary);
router.get('/recent-activity', protect, collegeAdminOnly, getRecentActivity);

module.exports = router;

