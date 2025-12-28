const express = require('express');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roles');
const router = express.Router();

// GET /analytics - Admin only (enrollment statistics)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    // Total students
    const totalStudents = await Student.countDocuments({ role: 'student' });
    
    // Total courses
    const totalCourses = await Course.countDocuments();
    
    // Total enrollments by status
    const enrollmentStats = await Enrollment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Course-wise enrollment count
    const courseEnrollments = await Enrollment.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $group: {
          _id: '$course',
          enrolledCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      {
        $unwind: '$courseInfo'
      },
      {
        $project: {
          courseTitle: '$courseInfo.title',
          enrolledCount: 1
        }
      },
      {
        $sort: { enrolledCount: -1 }
      }
    ]);

    // Recent enrollments
    const recentEnrollments = await Enrollment.find({ status: 'approved' })
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort({ approvedDate: -1 })
      .limit(5);

    res.json({
      totalStudents,
      totalCourses,
      enrollmentStats,
      courseEnrollments,
      recentEnrollments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;