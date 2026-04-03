const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const ClassModel = require('../models/Class');
const College = require('../models/College');
const User = require('../models/User');
const { resolveCollegeContext } = require('../utils/collegeContext');
const {
  dedupeDepartments,
  normalizeDepartmentName
} = require('../utils/department');

const generateTemporaryPassword = () => `${crypto.randomBytes(4).toString('hex')}A1!`;

const getCollegeDepartments = async (req, res) => {
  try {
    const { college, collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const scope = { $or: [{ collegeId }, { college: collegeName }] };

    const [userDepartments, classDepartments, sessionDepartments, attendanceDepartments] = await Promise.all([
      User.distinct('department', { ...scope, department: { $exists: true, $ne: '' } }),
      ClassModel.distinct('department', { collegeId, department: { $exists: true, $ne: '' } }),
      AttendanceSession.distinct('department', { collegeId, department: { $exists: true, $ne: '' } }),
      Attendance.distinct('department', { collegeId, department: { $exists: true, $ne: '' } })
    ]);

    const mergedDepartments = dedupeDepartments([
      ...(college.departments || []),
      ...userDepartments,
      ...classDepartments,
      ...sessionDepartments,
      ...attendanceDepartments
    ]);

    const currentDepartments = dedupeDepartments(college.departments || []);
    const hasDepartmentChanges =
      mergedDepartments.length !== currentDepartments.length ||
      mergedDepartments.some((department, index) => department !== currentDepartments[index]);

    if (hasDepartmentChanges) {
      college.departments = mergedDepartments;
      await college.save();
    }

    res.json({
      collegeId: college._id,
      collegeName: college.name,
      departments: mergedDepartments
    });
  } catch (error) {
    console.error('Get College Departments Error:', error);
    res.status(500).json({ message: error.message || 'Server error fetching departments' });
  }
};

const addCollegeDepartment = async (req, res) => {
  try {
    const { college } = await resolveCollegeContext(req.user.id);
    const departmentName = normalizeDepartmentName(req.body.name);

    if (!departmentName) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const alreadyExists = (college.departments || []).some(
      (department) => department.toLowerCase() === departmentName.toLowerCase()
    );
    if (alreadyExists) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    college.departments.push(departmentName);
    college.departments = dedupeDepartments(college.departments);
    await college.save();

    res.status(201).json({
      message: 'Department added successfully',
      departments: college.departments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const renameCollegeDepartment = async (req, res) => {
  try {
    const { college, collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const oldName = normalizeDepartmentName(req.body.oldName);
    const newName = normalizeDepartmentName(req.body.newName);

    if (!oldName || !newName) {
      return res.status(400).json({ message: 'Old and new department names are required' });
    }

    const existingOldName = (college.departments || []).find(
      (department) => department.toLowerCase() === oldName.toLowerCase()
    );
    if (!existingOldName) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const existingNewName = (college.departments || []).find(
      (department) => department.toLowerCase() === newName.toLowerCase()
    );
    if (existingNewName && existingNewName.toLowerCase() !== existingOldName.toLowerCase()) {
      return res.status(400).json({ message: 'A department with the new name already exists' });
    }

    college.departments = college.departments.map((department) =>
      department.toLowerCase() === existingOldName.toLowerCase() ? newName : department
    );
    college.departments = dedupeDepartments(college.departments);
    await college.save();

    const scope = { $or: [{ collegeId }, { college: collegeName }] };
    await Promise.all([
      User.updateMany({ ...scope, department: oldName }, { $set: { department: newName } }),
      ClassModel.updateMany({ collegeId, department: oldName }, { $set: { department: newName } }),
      AttendanceSession.updateMany({ collegeId, department: oldName }, { $set: { department: newName } }),
      Attendance.updateMany({ collegeId, department: oldName }, { $set: { department: newName } })
    ]);

    res.json({
      message: 'Department renamed successfully',
      departments: college.departments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const deleteCollegeDepartment = async (req, res) => {
  try {
    const { college, collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const departmentName = normalizeDepartmentName(decodeURIComponent(req.params.name));
    const canonicalDepartmentName = (college.departments || []).find(
      (department) => department.toLowerCase() === departmentName.toLowerCase()
    );

    if (!canonicalDepartmentName) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const scope = { $or: [{ collegeId }, { college: collegeName }] };
    const [userCount, courseCount] = await Promise.all([
      User.countDocuments({ ...scope, department: canonicalDepartmentName }),
      ClassModel.countDocuments({ collegeId, department: canonicalDepartmentName })
    ]);

    if (userCount > 0 || courseCount > 0) {
      return res.status(400).json({
        message: 'Remove or reassign users and courses from this department before deleting it'
      });
    }

    college.departments = college.departments.filter(
      (department) => department.toLowerCase() !== canonicalDepartmentName.toLowerCase()
    );
    await college.save();

    res.json({
      message: 'Department deleted successfully',
      departments: college.departments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

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
      departments
    } = req.body;

    if (!name || !code || !university || !emailDomain || !adminName || !adminEmail || !adminPhone) {
      return res.status(400).json({ message: 'Please provide all mandatory fields' });
    }

    const [collegeExists, userExists] = await Promise.all([
      College.findOne({ code }),
      User.findOne({ email: adminEmail })
    ]);

    if (collegeExists) {
      return res.status(400).json({ message: 'College code already exists' });
    }

    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const college = await College.create({
      name,
      code,
      university,
      emailDomain,
      status: 'APPROVED',
      isActive: true,
      maxStudents: maxStudents || 1000,
      maxTeachers: maxTeachers || 50,
      departments: dedupeDepartments(departments || [])
    });

    const generatedPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: hashedPassword,
      role: 'college_admin',
      status: 'APPROVED',
      college: name,
      collegeId: college._id
    });

    college.collegeAdmin = adminUser._id;
    await college.save();

    res.status(201).json({
      message: 'College and admin created successfully',
      college,
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        temporaryPassword: generatedPassword
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

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

const updateCollege = async (req, res) => {
  try {
    const existingCollege = await College.findById(req.params.id);

    if (!existingCollege) {
      return res.status(404).json({ message: 'College not found' });
    }

    const oldCollegeName = existingCollege.name;
    const {
      status,
      isActive,
      maxStudents,
      maxTeachers,
      name,
      university,
      departments,
      emailDomain
    } = req.body;

    if (status) existingCollege.status = status;
    if (typeof isActive !== 'undefined') existingCollege.isActive = isActive;
    if (maxStudents) existingCollege.maxStudents = maxStudents;
    if (maxTeachers) existingCollege.maxTeachers = maxTeachers;
    if (name) existingCollege.name = name;
    if (university) existingCollege.university = university;
    if (emailDomain) existingCollege.emailDomain = emailDomain;
    if (departments) existingCollege.departments = dedupeDepartments(departments);

    await existingCollege.save();

    if (name && name !== oldCollegeName) {
      const legacyScope = { $or: [{ collegeId: existingCollege._id }, { college: oldCollegeName }] };
      await Promise.all([
        User.updateMany(legacyScope, { $set: { college: name, collegeId: existingCollege._id } }),
        ClassModel.updateMany({ $or: [{ collegeId: existingCollege._id }, { college: oldCollegeName }] }, { $set: { college: name, collegeId: existingCollege._id } }),
        AttendanceSession.updateMany({ $or: [{ collegeId: existingCollege._id }, { college: oldCollegeName }] }, { $set: { college: name, collegeId: existingCollege._id } }),
        Attendance.updateMany({ collegeId: existingCollege._id }, { $set: { college: name } })
      ]);
    }

    const college = await College.findById(existingCollege._id).populate('collegeAdmin', 'name email phone');
    res.json(college);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCollege = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    const legacyScope = { $or: [{ collegeId: college._id }, { college: college.name }] };
    await Promise.all([
      User.deleteMany(legacyScope),
      ClassModel.deleteMany({ $or: [{ collegeId: college._id }, { college: college.name }] }),
      AttendanceSession.deleteMany({ $or: [{ collegeId: college._id }, { college: college.name }] }),
      Attendance.deleteMany({ collegeId: college._id })
    ]);

    await College.findByIdAndDelete(req.params.id);

    res.json({ message: 'College deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [totalColleges, activeStudents, totalTeachers, attendanceSessions] = await Promise.all([
      College.countDocuments(),
      User.countDocuments({ role: 'student', status: 'APPROVED' }),
      User.countDocuments({ role: 'teacher', status: 'APPROVED' }),
      AttendanceSession.countDocuments()
    ]);

    res.json({
      totalColleges,
      activeStudents,
      totalTeachers,
      attendanceSessions
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
  getDashboardStats,
  getCollegeDepartments,
  addCollegeDepartment,
  renameCollegeDepartment,
  deleteCollegeDepartment
};
