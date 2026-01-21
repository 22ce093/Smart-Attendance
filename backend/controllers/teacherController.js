const User = require('../models/User');

// @desc    Get all pending students
// @route   GET /api/teacher/pending
// @access  Private (Teacher/Admin)
const getPendingStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', status: 'PENDING' })
      .select('-password');
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve a student
// @route   POST /api/teacher/approve/:id
// @access  Private (Teacher/Admin)
const approveStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.role !== 'student') {
        return res.status(400).json({ message: 'User is not a student' });
    }

    student.status = 'APPROVED';
    // Optionally assign the confirming teacher
    student.assignedTeacher = req.user.id;
    
    await student.save();

    res.json({ message: 'Student approved successfully', student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject a student
// @route   POST /api/teacher/reject/:id
// @access  Private (Teacher/Admin)
const rejectStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.status = 'REJECTED';
    await student.save();

    res.json({ message: 'Student rejected', student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPendingStudents,
  approveStudent,
  rejectStudent
};
