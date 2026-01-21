const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  validateFullName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateEnrollmentId,
  validateTeacherId
} = require('../utils/validators');

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, department, enrollmentId, teacherId, college } = req.body;

    // Prevent superadmin registration
    if (role === 'superadmin') {
      return res.status(403).json({ message: 'Super Admin registration is not allowed' });
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    // Validation
    if (!validateFullName(name)) {
      return res.status(400).json({ message: 'Full name can only contain letters and spaces' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters with 1 digit and 1 symbol' });
    }

    // Role-specific validation
    if (role === 'student') {
      if (!enrollmentId) {
        return res.status(400).json({ message: 'Enrollment ID is required for students' });
      }
      if (!validateEnrollmentId(enrollmentId)) {
        return res.status(400).json({ message: 'Enrollment ID must be in format like 22CE093 (YY+Branch+Number)' });
      }
      if (!department) {
        return res.status(400).json({ message: 'Department is required for students' });
      }
    }

    if (role === 'teacher') {
      if (!teacherId) {
        return res.status(400).json({ message: 'Teacher ID is required for teachers' });
      }
      if (!validateTeacherId(teacherId)) {
        return res.status(400).json({ message: 'Teacher ID must be in format like CE001 (Branch+Number)' });
      }
      if (!department) {
        return res.status(400).json({ message: 'Department is required for teachers' });
      }
    }

    if (role === 'college_admin') {
      if (!college) {
        return res.status(400).json({ message: 'College is required for College Admin' });
      }
      // College admin does NOT require department
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check for duplicate enrollmentId or teacherId
    if (enrollmentId) {
      const enrollmentExists = await User.findOne({ enrollmentId });
      if (enrollmentExists) {
        return res.status(400).json({ message: 'Enrollment ID already exists' });
      }
    }
    if (teacherId) {
      const teacherIdExists = await User.findOne({ teacherId });
      if (teacherIdExists) {
        return res.status(400).json({ message: 'Teacher ID already exists' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine status: college_admin, teacher, student need approval
    const status = (role === 'college_admin' || role === 'teacher' || role === 'student') ? 'PENDING' : 'APPROVED';

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || undefined,
      department: department || undefined,
      enrollmentId: enrollmentId || undefined,
      teacherId: teacherId || undefined,
      college: college || undefined,
      status
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        message: status === 'PENDING' ? 'Registration successful! Please wait for approval before logging in.' : 'Registration successful!',
        token: status === 'APPROVED' ? generateToken(user._id, user.role) : undefined,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check for user email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (user && isMatch) {
      // Check status
      if (user.status !== 'APPROVED') {
        return res.status(403).json({ message: `Account is ${user.status}. Please wait for approval.` });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        department: user.department,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};

