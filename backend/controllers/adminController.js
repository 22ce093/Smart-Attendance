const bcrypt = require('bcryptjs');
const ClassModel = require('../models/Class');
const User = require('../models/User');
const {
  validateEmail,
  validateEnrollmentId,
  validateFullName,
  validatePassword,
  validatePhone,
  validateTeacherId
} = require('../utils/validators');
const { resolveCollegeContext } = require('../utils/collegeContext');
const {
  equalDepartmentNames,
  normalizeDepartmentName,
  resolveDepartmentValue
} = require('../utils/department');

const buildCollegeScope = (collegeId, collegeName) => ({
  $or: [{ collegeId }, { college: collegeName }]
});
const resolveCollegeDepartment = (department, departments = []) => {
  const normalizedDepartment = normalizeDepartmentName(department);
  if (!normalizedDepartment) {
    return '';
  }

  if (!departments.length) {
    return normalizedDepartment;
  }

  const existsInCollege = departments.some((item) => equalDepartmentNames(item, normalizedDepartment));
  if (!existsInCollege) {
    return normalizedDepartment;
  }

  return resolveDepartmentValue(normalizedDepartment, departments);
};

const ensureCollegeScopedUser = (user, collegeId, collegeName) => {
  const collegeIdMatches = user.collegeId && user.collegeId.toString() === collegeId.toString();
  const collegeNameMatches = user.college === collegeName;
  return collegeIdMatches || collegeNameMatches;
};

const getPendingCollegeAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'college_admin', status: 'PENDING' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const approveCollegeAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'college_admin') {
      return res.status(400).json({ message: 'User is not a college admin' });
    }

    user.status = 'APPROVED';
    await user.save();

    res.json({ message: 'College admin approved successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const rejectCollegeAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'REJECTED';
    await user.save();

    res.json({ message: 'College admin rejected', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPendingTeachers = async (req, res) => {
  try {
    const { collegeId, collegeName } = await resolveCollegeContext(req.user.id);

    const teachers = await User.find({
      role: 'teacher',
      status: 'PENDING',
      ...buildCollegeScope(collegeId, collegeName)
    }).select('-password');

    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const approveUser = async (req, res) => {
  try {
    const { collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!['teacher', 'student'].includes(user.role)) {
      return res.status(400).json({ message: 'Only teacher and student accounts can be approved here' });
    }

    if (!ensureCollegeScopedUser(user, collegeId, collegeName)) {
      return res.status(403).json({ message: 'You can only manage users from your own college' });
    }

    user.status = 'APPROVED';
    await user.save();

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!ensureCollegeScopedUser(user, collegeId, collegeName)) {
      return res.status(403).json({ message: 'You can only manage users from your own college' });
    }

    user.status = 'REJECTED';
    await user.save();

    res.json({ message: 'User rejected successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const createUser = async (req, res) => {
  try {
    const { college, collegeId } = await resolveCollegeContext(req.user.id);
    const { name, email, password, role, phone, department, enrollmentId, teacherId } = req.body;
    const normalizedDepartment = resolveCollegeDepartment(department, college.departments || []);
    const normalizedEnrollmentId = enrollmentId ? String(enrollmentId).trim().toUpperCase() : '';
    const normalizedTeacherId = teacherId ? String(teacherId).trim().toUpperCase() : '';

    if (!name || !email || !password || !role || !normalizedDepartment) {
      return res.status(400).json({ message: 'Name, email, password, role, and department are required' });
    }

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'College admins can only create student or teacher accounts' });
    }

    if (!validateFullName(name)) {
      return res.status(400).json({ message: 'Name can only contain letters and spaces' });
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
    if (role === 'student' && (!normalizedEnrollmentId || !validateEnrollmentId(normalizedEnrollmentId))) {
      return res.status(400).json({ message: 'Student enrollment ID must use format like 22CE093' });
    }
    if (role === 'teacher' && (!normalizedTeacherId || !validateTeacherId(normalizedTeacherId))) {
      return res.status(400).json({ message: 'Teacher ID must use format like CE001' });
    }

    const [userExists, enrollmentExists, teacherExists] = await Promise.all([
      User.findOne({ email }),
      normalizedEnrollmentId ? User.findOne({ enrollmentId: normalizedEnrollmentId }) : null,
      normalizedTeacherId ? User.findOne({ teacherId: normalizedTeacherId }) : null
    ]);

    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }
    if (enrollmentExists) {
      return res.status(400).json({ message: 'Enrollment ID already exists' });
    }
    if (teacherExists) {
      return res.status(400).json({ message: 'Teacher ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || undefined,
      department: normalizedDepartment,
      enrollmentId: role === 'student' ? normalizedEnrollmentId : undefined,
      teacherId: role === 'teacher' ? normalizedTeacherId : undefined,
      college: college.name,
      collegeId,
      status: 'APPROVED'
    });

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      department: user.department
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const query = {};
    const conditions = [];
    const { role, search } = req.query;

    if (req.user.role === 'college_admin') {
      const { collegeId, collegeName } = await resolveCollegeContext(req.user.id);
      conditions.push(buildCollegeScope(collegeId, collegeName));
    }

    if (role) {
      query.role = role;
    }

    if (search) {
      conditions.push({
        $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { enrollmentId: { $regex: search, $options: 'i' } },
        { teacherId: { $regex: search, $options: 'i' } }
      ]});
    }

    const finalQuery = conditions.length > 0 ? { ...query, $and: conditions } : query;
    const users = await User.find(finalQuery).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'college_admin') {
      const { collegeId, collegeName, college } = await resolveCollegeContext(req.user.id);

      if (!ensureCollegeScopedUser(user, collegeId, collegeName)) {
        return res.status(403).json({ message: 'You can only edit users from your own college' });
      }

      const { name, email, phone, department, status } = req.body;

      if (name && !validateFullName(name)) {
        return res.status(400).json({ message: 'Name can only contain letters and spaces' });
      }
      if (email && !validateEmail(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
      if (phone && !validatePhone(phone)) {
        return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
      }

      const normalizedDepartment = department
        ? resolveCollegeDepartment(department, college.departments || [])
        : '';
      if (department && !normalizedDepartment) {
        return res.status(400).json({ message: 'Department must exist in your college' });
      }

      if (email && email !== user.email) {
        const emailInUse = await User.findOne({ email });
        if (emailInUse) {
          return res.status(400).json({ message: 'A user with this email already exists' });
        }
      }

      Object.assign(user, {
        name: name || user.name,
        email: email || user.email,
        phone: phone || user.phone,
        department: normalizedDepartment || user.department,
        status: status || user.status
      });
    } else {
      if (req.body.status) {
        user.status = req.body.status;
      }
    }

    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'college_admin') {
      const { collegeId, collegeName } = await resolveCollegeContext(req.user.id);
      if (!ensureCollegeScopedUser(user, collegeId, collegeName)) {
        return res.status(403).json({ message: 'You can only delete users from your own college' });
      }
      if (!['teacher', 'student'].includes(user.role)) {
        return res.status(403).json({ message: 'College admins can only delete teacher or student accounts' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = user.status === 'BLOCKED' ? 'APPROVED' : 'BLOCKED';
    await user.save();

    res.json({ message: `User status changed to ${user.status}`, status: user.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCollegeTeachers = async (req, res) => {
  try {
    const { collegeId, collegeName } = await resolveCollegeContext(req.user.id);

    const teachers = await User.find({
      role: 'teacher',
      status: 'APPROVED',
      ...buildCollegeScope(collegeId, collegeName)
    })
      .select('name email teacherId department')
      .sort({ name: 1 });

    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const getCourses = async (req, res) => {
  try {
    const { collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const courses = await ClassModel.find(buildCollegeScope(collegeId, collegeName))
      .populate('assignedTeacher', 'name email teacherId')
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const { collegeId, college, collegeName } = await resolveCollegeContext(req.user.id);
    const { name, code, description, semester, section, department, assignedTeacher, isActive } = req.body;
    const normalizedDepartment = resolveCollegeDepartment(department, college.departments || []);

    if (!name || !code || !normalizedDepartment) {
      return res.status(400).json({ message: 'Course name, code, and department are required' });
    }

    if (assignedTeacher) {
      const teacher = await User.findById(assignedTeacher);
      if (!teacher || teacher.role !== 'teacher' || !ensureCollegeScopedUser(teacher, collegeId, collegeName)) {
        return res.status(400).json({ message: 'Assigned teacher must belong to your college' });
      }
    }

    const course = await ClassModel.create({
      name,
      code: code.toUpperCase(),
      description: description || undefined,
      semester: semester || undefined,
      section: section || undefined,
      department: normalizedDepartment,
      assignedTeacher: assignedTeacher || undefined,
      college: college.name,
      collegeId,
      isActive: typeof isActive === 'boolean' ? isActive : true
    });

    const populated = await ClassModel.findById(course._id).populate('assignedTeacher', 'name email teacherId');
    res.status(201).json(populated);
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course code already exists for this college' });
    }

    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { collegeId, college, collegeName } = await resolveCollegeContext(req.user.id);
    const course = await ClassModel.findById(req.params.id);
    const hasCourseCollegeId =
      course?.collegeId && String(course.collegeId) === String(collegeId);
    const hasCourseCollegeName =
      course?.college && course.college === collegeName;

    if (!course || (!hasCourseCollegeId && !hasCourseCollegeName)) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const { name, code, description, semester, section, department, assignedTeacher, isActive } = req.body;
    const normalizedDepartment = department
      ? resolveCollegeDepartment(department, college.departments || [])
      : '';

    if (department && !normalizedDepartment) {
      return res.status(400).json({ message: 'Department must exist in your college' });
    }

    if (assignedTeacher) {
      const teacher = await User.findById(assignedTeacher);
      if (!teacher || teacher.role !== 'teacher' || !ensureCollegeScopedUser(teacher, collegeId, collegeName)) {
        return res.status(400).json({ message: 'Assigned teacher must belong to your college' });
      }
    }

    Object.assign(course, {
      name: name || course.name,
      code: code ? code.toUpperCase() : course.code,
      description: typeof description === 'string' ? description : course.description,
      semester: typeof semester === 'string' ? semester : course.semester,
      section: typeof section === 'string' ? section : course.section,
      department: normalizedDepartment || course.department,
      assignedTeacher: assignedTeacher || undefined,
      isActive: typeof isActive === 'boolean' ? isActive : course.isActive
    });

    await course.save();
    const populated = await ClassModel.findById(course._id).populate('assignedTeacher', 'name email teacherId');
    res.json(populated);
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course code already exists for this college' });
    }

    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { collegeId, collegeName } = await resolveCollegeContext(req.user.id);
    const course = await ClassModel.findById(req.params.id);
    const hasCourseCollegeId =
      course?.collegeId && String(course.collegeId) === String(collegeId);
    const hasCourseCollegeName =
      course?.college && course.college === collegeName;

    if (!course || (!hasCourseCollegeId && !hasCourseCollegeName)) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await ClassModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
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
};
