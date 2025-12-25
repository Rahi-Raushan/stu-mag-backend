const express = require('express');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const auth = require('../middleware/auth');
const { adminOnly, studentOnly } = require('../middleware/roles');
const router = express.Router();

// GET /students/my-courses - Student only (approved courses)
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

// GET /students/my-requests - Student only (all request statuses)
router.get('/my-requests', auth, studentOnly, async (req, res) => {
  try {
    const requests = await Enrollment.find({ 
      student: req.user._id
    }).populate('course', 'title description');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /students/profile - Student only (get own profile)
router.get('/profile', auth, studentOnly, async (req, res) => {
  try {
    const student = await Student.findById(req.user._id).select('-password');
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /students/profile - Student only (update own profile)
router.put('/profile', auth, studentOnly, async (req, res) => {
  try {
    const { name, age, city, contactNumber, fatherName } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.user._id, 
      { name, age, city, contactNumber, fatherName }, 
      { new: true }
    ).select('-password');
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /students - Admin only (all students)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const students = await Student.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /students/:id - Admin only (edit student)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, age, city, contactNumber, fatherName, erpNo } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id, 
      { name, email, age, city, contactNumber, fatherName, erpNo }, 
      { new: true }
    ).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /students/:id - Admin only (delete student)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    // Also delete all enrollments for this student
    await Enrollment.deleteMany({ student: req.params.id });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /students/:id/courses - Admin only (get student's courses)
router.get('/:id/courses', auth, adminOnly, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ 
      student: req.params.id 
    }).populate('course', 'title description');
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;