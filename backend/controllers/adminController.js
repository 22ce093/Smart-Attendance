const User = require('../models/User');
const bcrypt = require('bcryptjs');

// =============================================
// SUPER ADMIN ENDPOINTS
// =============================================

// @desc    Get all pending college admins (Super Admin only)
// @route   GET /api/admin/pending-college-admins
// @access  Private (Super Admin)
const getPendingCollegeAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'college_admin', status: 'PENDING' })
      .select('-password');
    res.json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve a college admin (Super Admin only)
// @route   POST /api/admin/approve-college-admin/:id
// @access  Private (Super Admin)
const approveCollegeAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'college_admin') {
      return res.status(400).json({ message: 'User is not a College Admin' });
    }

    user.status = 'APPROVED';
    await user.save();

    res.json({ message: 'College Admin approved successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject a college admin (Super Admin only)
// @route   POST /api/admin/reject-college-admin/:id
// @access  Private (Super Admin)
const rejectCollegeAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'REJECTED';
    await user.save();

    res.json({ message: 'College Admin rejected', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// =============================================
// COLLEGE ADMIN ENDPOINTS
// =============================================

// @desc    Get all pending teachers for THIS college (College Admin only)
// @route   GET /api/admin/pending-teachers
// @access  Private (College Admin)
const getPendingTeachers = async (req, res) => {
  try {
    // Get the logged-in admin's college
    const admin = await User.findById(req.user.id);
    if (!admin || !admin.college) {
      return res.status(400).json({ message: 'Admin college not found' });
    }

    // Only get teachers from the same college
    const teachers = await User.find({ 
      role: 'teacher', 
      status: 'PENDING',
      college: admin.college 
    }).select('-password');
    
    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve a teacher (College Admin only - must be same college)
// @route   POST /api/admin/approve/:id
// @access  Private (College Admin)
const approveUser = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // College Admin can only approve teachers from their own college
    if (user.role === 'teacher' && user.college !== admin.college) {
      return res.status(403).json({ message: 'You can only approve teachers from your own college' });
    }

    user.status = 'APPROVED';
    await user.save();

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject a user
// @route   POST /api/admin/reject/:id
// @access  Private (College Admin)
const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'REJECTED';
    await user.save();

    res.json({ message: 'User rejected', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a user (Student/Teacher) directly
// @route   POST /api/admin/create-user
// @access  Private (College Admin)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, department, enrollmentId, teacherId, college } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      department,
      enrollmentId: enrollmentId || undefined,
      teacherId: teacherId || undefined,
      college,
      status: 'APPROVED' // Admin created users are auto-approved
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users (for management list)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};

