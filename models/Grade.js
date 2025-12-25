const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  assignment: { type: String, required: true },
  marks: { type: Number, required: true, min: 0, max: 100 },
  totalMarks: { type: Number, required: true, default: 100 },
  grade: { type: String, enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'] },
  feedback: { type: String },
  submissionDate: { type: Date, default: Date.now },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }
}, { timestamps: true });

// Calculate grade based on percentage
gradeSchema.pre('save', function(next) {
  const percentage = (this.marks / this.totalMarks) * 100;
  if (percentage >= 90) this.grade = 'A+';
  else if (percentage >= 85) this.grade = 'A';
  else if (percentage >= 80) this.grade = 'B+';
  else if (percentage >= 75) this.grade = 'B';
  else if (percentage >= 70) this.grade = 'C+';
  else if (percentage >= 60) this.grade = 'C';
  else if (percentage >= 50) this.grade = 'D';
  else this.grade = 'F';
  next();
});

module.exports = mongoose.model('Grade', gradeSchema);