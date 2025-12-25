const express = require('express');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const { adminOnly, studentOnly } = require('../middleware/roles');
const router = express.Router();

// POST /attendance - Admin only (Mark attendance)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const attendance = new Attendance({
      ...req.body,
      markedBy: req.user._id
    });
    await attendance.save();
    await attendance.populate(['student', 'course']);
    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /attendance/student/:studentId - Get student attendance
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.params.studentId })
      .populate('course', 'title courseCode')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /attendance/my-attendance - Student only (Get own attendance)
router.get('/my-attendance', auth, studentOnly, async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.user._id })
      .populate('course', 'title courseCode')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /attendance/course/:courseId - Admin only (Get course attendance)
router.get('/course/:courseId', auth, adminOnly, async (req, res) => {
  try {
    const { date } = req.query;
    const query = { course: req.params.courseId };
    if (date) query.date = new Date(date);
    
    const attendance = await Attendance.find(query)
      .populate('student', 'name email')
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /attendance/analytics/:studentId - Get attendance analytics
router.get('/analytics/:studentId', auth, async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.params.studentId });
    
    const analytics = {
      totalClasses: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length
    };
    
    analytics.attendancePercentage = analytics.totalClasses > 0 
      ? ((analytics.present + analytics.late) / analytics.totalClasses * 100).toFixed(2)
      : 0;
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;