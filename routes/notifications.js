const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roles');
const router = express.Router();

// POST /notifications - Admin only (Create notification)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const notification = new Notification({
      ...req.body,
      sender: req.user._id
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /notifications/my-notifications - Get user notifications
router.get('/my-notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /notifications/:id/read - Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /notifications/unread-count - Get unread notifications count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /notifications/broadcast - Admin only (Send to all students)
router.post('/broadcast', auth, adminOnly, async (req, res) => {
  try {
    const Student = require('../models/Student');
    const students = await Student.find({ role: 'student' });
    
    const notifications = students.map(student => ({
      recipient: student._id,
      sender: req.user._id,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || 'announcement',
      priority: req.body.priority || 'medium'
    }));
    
    await Notification.insertMany(notifications);
    res.json({ message: `Notification sent to ${students.length} students` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;