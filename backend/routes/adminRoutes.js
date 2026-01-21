const express = require('express');
const router = express.Router();
const { 
  // Super Admin
  getPendingCollegeAdmins, 
  approveCollegeAdmin, 
  rejectCollegeAdmin,
  // College Admin
  getPendingTeachers, 
  approveUser, 
  rejectUser, 
  createUser, 
  getAllUsers 
} = require('../controllers/adminController');
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

// ===== College Admin Routes =====
router.get('/pending-teachers', protect, collegeAdminOnly, getPendingTeachers);
router.post('/approve/:id', protect, collegeAdminOnly, approveUser);
router.post('/reject/:id', protect, collegeAdminOnly, rejectUser);
router.post('/create-user', protect, collegeAdminOnly, createUser);
router.get('/users', protect, collegeAdminOnly, getAllUsers);

module.exports = router;

