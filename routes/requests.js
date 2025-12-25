const express = require('express');
const Enrollment = require('../models/Enrollment');
const auth = require('../middleware/auth');
const { studentOnly, adminOnly } = require('../middleware/roles');
const router = express.Router();

// POST /request/:courseId - Student only (creates pending enrollment)
router.post('/:courseId', auth, studentOnly, async (req, res) => {
  try {
    const enrollment = new Enrollment({
      student: req.user._id,
      course: req.params.courseId,
      status: 'pending'
    });
    await enrollment.save();
    res.status(201).json({ message: 'Course request submitted successfully. Waiting for admin approval.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Already requested this course' });
    }
    res.status(400).json({ message: error.message });
  }
});

// GET /requests - Admin only (all pending requests)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const requests = await Enrollment.find({ status: 'pending' })
      .populate('student', 'name email age city')
      .populate('course', 'title description');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /request/:id/approve - Admin only
router.put('/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        approvedBy: req.user._id,
        approvedDate: new Date()
      },
      { new: true }
    ).populate('student', 'name email').populate('course', 'title');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json({ message: 'Request approved successfully', enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /request/:id/reject - Admin only
router.put('/:id/reject', auth, adminOnly, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).populate('student', 'name email').populate('course', 'title');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json({ message: 'Request rejected', enrollment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;