const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['enrollment', 'grade', 'attendance', 'announcement', 'system'], 
    required: true 
  },
  isRead: { type: Boolean, default: false },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // Reference to related document
  expiresAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);