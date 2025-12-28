const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Routes import करना
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollment');
const requestRoutes = require('./routes/requests');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// CORS Configuration - Frontend के साथ connection के लिए
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://stu-mag-frontend.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON data parse करने के लिए middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection function
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

// Health check route - Server status check करने के लिए
app.get('/', (req, res) => {
  res.json({ 
    message: 'Student Management System Backend API',
    status: 'Running'
  });
});

// API Routes setup करना
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enroll', enrollmentRoutes);
app.use('/api/request', requestRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware - सभी errors को handle करने के लिए
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Server start करना
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;