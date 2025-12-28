const express = require('express');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const { studentOnly, adminOnly } = require('../middleware/roles');
const router = express.Router();

// POST /request/:courseId - Student only (creates pending enrollment)
router.post('/:courseId', auth, studentOnly, async (req, res) => {
  try {
    // Check if student already has a pending request for this course
    const existingPendingRequest = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId,
      status: 'pending'
    });
    
    if (existingPendingRequest) {
      return res.status(400).json({ message: 'You already have a pending request for this course' });
    }
    
    const enrollment = new Enrollment({
      student: req.user._id,
      course: req.params.courseId,
      status: 'pending',
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentPhone: req.user.contactNumber
    });
    
    await enrollment.save();
    res.status(201).json({ message: 'Course request submitted successfully. Waiting for admin approval.' });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(400).json({ message: error.message });
  }
});

// GET /requests - Admin only (all requests sorted by newest first)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const requests = await Enrollment.find()
      .populate('student', 'name email age city contactNumber')
      .populate('course', 'title description')
      .sort({ createdAt: -1 });
    
    // Auto-fix missing student info in existing records
    const processedRequests = await Promise.all(requests.map(async (request) => {
      const requestObj = request.toObject();
      
      // If phone is missing, update from student data
      if ((!requestObj.studentPhone || requestObj.studentPhone === 'Not provided') && requestObj.student?.contactNumber) {
        await Enrollment.findByIdAndUpdate(request._id, {
          studentName: requestObj.student.name,
          studentEmail: requestObj.student.email,
          studentPhone: requestObj.student.contactNumber
        });
        requestObj.studentPhone = requestObj.student.contactNumber;
      }
      
      // Ensure all fields are populated for display
      requestObj.studentName = requestObj.studentName || requestObj.student?.name || 'Unknown';
      requestObj.studentEmail = requestObj.studentEmail || requestObj.student?.email || 'Unknown';
      requestObj.studentPhone = requestObj.studentPhone || requestObj.student?.contactNumber || 'Not provided';
      
      return requestObj;
    }));
    
    res.json(processedRequests);
  } catch (error) {
    console.error('Get requests error:', error);
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

// POST /fix-phone-numbers - Admin only (one-time fix for missing phone numbers)
router.post('/fix-phone-numbers', auth, adminOnly, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ 
      $or: [
        { studentPhone: { $exists: false } },
        { studentPhone: 'Not provided' },
        { studentPhone: '' },
        { studentPhone: null }
      ]
    }).populate('student');
    
    let updated = 0;
    for (const enrollment of enrollments) {
      if (enrollment.student && enrollment.student.contactNumber) {
        await Enrollment.findByIdAndUpdate(enrollment._id, {
          studentName: enrollment.student.name,
          studentEmail: enrollment.student.email,
          studentPhone: enrollment.student.contactNumber
        });
        updated++;
      }
    }
    
    res.json({ message: `Updated ${updated} enrollment records with phone numbers` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;