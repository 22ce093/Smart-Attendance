const College = require('../models/College');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get defined departments for logged-in college admin
// @route   GET /api/admin/colleges/departments
// @access  Private (College Admin)
const getCollegeDepartments = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(400).json({ message: 'Admin user not found' });
    }

    // Prefer collegeId, but fall back to college name for legacy records
    let college = null;
    if (admin.collegeId) {
      college = await College.findById(admin.collegeId);
    }
    if (!college && admin.college) {
      college = await College.findOne({ name: admin.college });
    }

    if (!college) {
      return res.status(400).json({ message: 'College information not found for admin' });
    }

    const departments = college.departments || [];
    res.json({ departments });
  } catch (error) {
    console.error('Get College Departments Error:', error);
    res.status(500).json({ message: 'Server error fetching departments' });
  }
};

// @desc    Get single college by id
// @route   GET /api/admin/colleges/:id
// @access  Private (Super Admin)
const getCollegeById = async (req, res) => {
  try {
    const college = await College.findById(req.params.id).populate('collegeAdmin', 'name email phone');
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    res.json(college);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add a new college and its admin
// @route   POST /api/admin/colleges
// @access  Private (Super Admin)
const addCollege = async (req, res) => {
  try {
    const { 
      name, 
      code, 
      university, 
      emailDomain, 
      adminName, 
      adminEmail, 
      adminPhone,
      maxStudents,
      maxTeachers,
      departments // Array of strings
    } = req.body;

    // Validation
    if (!name || !code || !university || !emailDomain || !adminName || !adminEmail || !adminPhone) {
      return res.status(400).json({ message: 'Please provide all mandatory fields' });
    }

    // Check if college code exists
    const collegeExists = await College.findOne({ code });
    if (collegeExists) {
      return res.status(400).json({ message: 'College code already exists' });
    }

    // Check if admin email exists
    const userExists = await User.findOne({ email: adminEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 1. Create College (initially without admin)
    const college = await College.create({
      name,
      code,
      university,
      emailDomain,
      status: 'APPROVED',
      isActive: true,
      maxStudents: maxStudents || 1000,
      maxTeachers: maxTeachers || 50,
      departments: departments || []
    });

    // 2. Create College Admin
    // Generate random password
    const generatedPassword = Math.random().toString(36).slice(-8) + 'A1!'; // Simple random password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);

    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: hashedPassword,
      role: 'college_admin',
      status: 'APPROVED', // Auto approved as created by Super Admin
      college: name, // Legacy string field
      collegeId: college._id // and new reference
    });

    // 3. Update College with Admin ID
    college.collegeAdmin = adminUser._id;
    await college.save();

    // 4. "Send Email" (Log for now)
    console.log(`[MOCK EMAIL] To: ${adminEmail} | Subject: Welcome to Smart Attendance | Password: ${generatedPassword}`);

    res.status(201).json({
      message: 'College and Admin created successfully',
      college,
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Get all colleges
// @route   GET /api/admin/colleges
// @access  Private (Super Admin)
const getColleges = async (req, res) => {
  try {
    const colleges = await College.find()
      .populate('collegeAdmin', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(colleges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update college details
// @route   PUT /api/admin/colleges/:id
// @access  Private (Super Admin)
const updateCollege = async (req, res) => {
  try {
    const { status, isActive, maxStudents, maxTeachers, name, university } = req.body;
    
    // Build update object
    const updateFields = {};
    if (status) updateFields.status = status;
    if (typeof isActive !== 'undefined') updateFields.isActive = isActive;
    if (maxStudents) updateFields.maxStudents = maxStudents;
    if (maxTeachers) updateFields.maxTeachers = maxTeachers;
    if (name) updateFields.name = name;
    if (university) updateFields.university = university;
    if (req.body.departments) updateFields.departments = req.body.departments;

    const college = await College.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate('collegeAdmin', 'name email');

    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    res.json(college);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete college (hard delete)
// @route   DELETE /api/admin/colleges/:id
// @access  Private (Super Admin)
const deleteCollege = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Remove the college document from DB
    await College.findByIdAndDelete(req.params.id);

    // Also remove the linked college admin user if present
    if (college.collegeAdmin) {
      try {
        await User.findByIdAndDelete(college.collegeAdmin);
      } catch (err) {
        console.warn('Failed to remove college admin user:', err.message);
      }
    }

    res.json({ message: 'College deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard-stats
// @access  Private (Super Admin)
const getDashboardStats = async (req, res) => {
  try {
    const totalColleges = await College.countDocuments();
    const activeStudents = await User.countDocuments({ role: 'student', status: 'APPROVED' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    // const attendanceSessions = await Attendance.countDocuments(); // If model exists

    res.json({
      totalColleges,
      activeStudents,
      totalTeachers,
      // attendanceSessions: 18400 // Mock for now if Attendance model not ready or huge
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addCollege,
  getColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
  getDashboardStats
  ,getCollegeDepartments
};
