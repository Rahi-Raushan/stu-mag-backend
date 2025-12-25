const express = require('express');
const Enrollment = require('../models/Enrollment');
const auth = require('../middleware/auth');
const { studentOnly, adminOnly } = require('../middleware/roles');
const router = express.Router();

// POST /enroll/:courseId - Student only (creates pending enrollment)
router.post('/:courseId', auth, studentOnly, async (req, res) => {
  try {
    const enrollment = new Enrollment({
      student: req.user._id,
      course: req.params.courseId,
      status: 'pending'
    });
    await enrollment.save();
    res.status(201).json({ message: 'Enrollment request submitted. Waiting for admin approval.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }
    res.status(400).json({ message: error.message });
  }
});

// GET /enroll/my-courses - Student only (approved courses)
router.get('/my-courses', auth, studentOnly, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ 
      student: req.user._id, 
      status: 'approved' 
    }).populate('course');
    const courses = enrollments.map(enrollment => enrollment.course);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /enroll/my-pending - Student only (pending enrollments)
router.get('/my-pending', auth, studentOnly, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ 
      student: req.user._id, 
      status: 'pending' 
    }).populate('course');
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /enroll/pending - Admin only (all pending enrollments)
router.get('/pending', auth, adminOnly, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ status: 'pending' })
      .populate('student', 'name email')
      .populate('course', 'title');
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /enroll/approve/:enrollmentId - Admin only
router.put('/approve/:enrollmentId', auth, adminOnly, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.enrollmentId,
      { 
        status: 'approved',
        approvedBy: req.user._id,
        approvedDate: new Date()
      },
      { new: true }
    ).populate('student', 'name email').populate('course', 'title');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    res.json({ message: 'Enrollment approved successfully', enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /enroll/reject/:enrollmentId - Admin only
router.put('/reject/:enrollmentId', auth, adminOnly, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.enrollmentId,
      { status: 'rejected' },
      { new: true }
    ).populate('student', 'name email').populate('course', 'title');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    res.json({ message: 'Enrollment rejected', enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;