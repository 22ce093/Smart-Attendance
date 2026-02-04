const mongoose = require('mongoose');

const CollegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  university: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  emailDomain: { type: String, required: true }, // e.g., @charusat.edu.in
  phone: { type: String },
  address: { type: String },
  website: { type: String },
  
  // Admin Details (Reference to the User who is the admin)
  collegeAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Limits
  maxStudents: { type: Number, default: 1000 },
  maxTeachers: { type: Number, default: 50 },

  // Status
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'SUSPENDED'], 
    default: 'APPROVED' 
  },
  isActive: { type: Boolean, default: true },

  // Departments
  departments: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('College', CollegeSchema);
