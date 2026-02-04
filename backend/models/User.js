const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  department: { type: String }, // Optional for college_admin, required for teacher/student
  enrollmentId: { type: String, unique: true, sparse: true }, // For students: 22CE093
  teacherId: { type: String, unique: true, sparse: true }, // For teachers: CE001
  college: { type: String },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED'],
    default: 'APPROVED' // Default APPROVED, logic handled in controller
  },
  assignedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { 
    type: String, 
    enum: ['superadmin', 'college_admin', 'teacher', 'student'], 
    default: 'student' 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
