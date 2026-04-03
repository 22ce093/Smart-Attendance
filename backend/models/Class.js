const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    semester: { type: String, trim: true },
    section: { type: String, trim: true },
    department: { type: String, required: true, trim: true },
    college: { type: String, required: true, trim: true },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true
    },
    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

ClassSchema.index({ collegeId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Class', ClassSchema);
