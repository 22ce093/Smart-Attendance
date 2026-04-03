const mongoose = require('mongoose');

const AttendanceSessionSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  college: { type: String },
  department: { type: String, required: true },
  course: { type: String, required: true },
  sessionCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number }
  },
  allowedRadiusMeters: {
    type: Number,
    default: 120
  },
  durationMinutes: {
    type: Number,
    default: 10
  },
  startsAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  endedAt: { type: Date },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

AttendanceSessionSchema.index({ teacher: 1, createdAt: -1 });
AttendanceSessionSchema.index({ collegeId: 1, department: 1, createdAt: -1 });

module.exports = mongoose.model('AttendanceSession', AttendanceSessionSchema);
