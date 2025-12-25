const express = require('express');
const Grade = require('../models/Grade');
const auth = require('../middleware/auth');
const { adminOnly, studentOnly } = require('../middleware/roles');
const router = express.Router();

// POST /grades - Admin only (Add grade)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const grade = new Grade({
      ...req.body,
      gradedBy: req.user._id
    });
    await grade.save();
    await grade.populate(['student', 'course']);
    res.status(201).json(grade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /grades/student/:studentId - Admin only (Get student grades)
router.get('/student/:studentId', auth, adminOnly, async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.studentId })
      .populate('course', 'title courseCode')
      .sort({ createdAt: -1 });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /grades/my-grades - Student only (Get own grades)
router.get('/my-grades', auth, studentOnly, async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.user._id })
      .populate('course', 'title courseCode')
      .sort({ createdAt: -1 });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /grades/course/:courseId - Admin only (Get course grades)
router.get('/course/:courseId', auth, adminOnly, async (req, res) => {
  try {
    const grades = await Grade.find({ course: req.params.courseId })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /grades/analytics/:studentId - Get student performance analytics
router.get('/analytics/:studentId', auth, async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.studentId });
    
    const analytics = {
      totalAssignments: grades.length,
      averageMarks: grades.reduce((sum, grade) => sum + grade.marks, 0) / grades.length || 0,
      gradeDistribution: {},
      recentGrades: grades.slice(-5)
    };
    
    // Calculate grade distribution
    grades.forEach(grade => {
      analytics.gradeDistribution[grade.grade] = (analytics.gradeDistribution[grade.grade] || 0) + 1;
    });
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;