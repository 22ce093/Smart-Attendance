const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession'
  },
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
  course: { type: String, required: true },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Teacher who marked it
  },
  deviceHash: { type: String, required: true },
  deviceLabel: { type: String },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number }
  },
  sessionLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  distanceMeters: { type: Number, required: true },
  verification: {
    type: String,
    enum: ['VERIFIED', 'REJECTED'],
    default: 'VERIFIED'
  }
}, { timestamps: true });

AttendanceSchema.index(
  { session: 1, student: 1 },
  { unique: true, partialFilterExpression: { session: { $exists: true } } }
);

AttendanceSchema.index(
  { session: 1, deviceHash: 1 },
  { unique: true, partialFilterExpression: { session: { $exists: true }, deviceHash: { $exists: true } } }
);

module.exports = mongoose.model('Attendance', AttendanceSchema);
