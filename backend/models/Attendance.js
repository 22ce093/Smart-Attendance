const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  status: { 
    type: String, 
    enum: ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'], 
    required: true 
  },
  collegeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'College',
    required: true
  },
  department: { type: String, required: true },
  course: { type: String }, // e.g., "Full Stack Development" or "Mathematics"
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Teacher who marked it
  }
}, { timestamps: true });

// Prevent duplicate attendance for same student on same day for same course (optional logic, but good constraint)
// AttendanceSchema.index({ student: 1, date: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
