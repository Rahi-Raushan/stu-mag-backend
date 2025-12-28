const mongoose = require('mongoose');

// Enrollment schema - Student ke course enrollment details store karne ke liye
const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  // Student ki details directly store karna - Easy access ke liye
  studentName: { type: String },
  studentEmail: { type: String },
  studentPhone: { type: String },
  enrollmentDate: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  approvedDate: { type: Date }
}, { timestamps: true });

// Prevent duplicate pending enrollments only
enrollmentSchema.index({ student: 1, course: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: 'pending' } 
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);