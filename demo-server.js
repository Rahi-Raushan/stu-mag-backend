const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data store for demo
let users = [
  {
    _id: '1',
    name: 'Admin User',
    email: 'admin@test.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
    age: 30,
    city: 'New York',
    role: 'admin'
  },
  {
    _id: '2',
    name: 'John Student',
    email: 'student@test.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // student123
    age: 20,
    city: 'Boston',
    role: 'student'
  }
];

let courses = [
  { _id: '1', title: 'Computer Science', description: 'Programming and algorithms' },
  { _id: '2', title: 'Mathematics', description: 'Advanced mathematics' },
  { _id: '3', title: 'Physics', description: 'Applied physics' }
];

let enrollments = [];

// Simple password check (for demo)
const checkPassword = (password, hash) => {
  return password === 'admin123' || password === 'student123';
};

// Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });
    
    const user = users.find(u => u.email === email);
    if (!user || !checkPassword(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = users.find(u => u._id === decoded.id);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Student profile routes
app.get('/api/students/profile', auth, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

app.put('/api/students/profile', auth, (req, res) => {
  const { name, age, city } = req.body;
  const userIndex = users.findIndex(u => u._id === req.user._id);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], name, age, city };
    const { password, ...updatedUser } = users[userIndex];
    res.json(updatedUser);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Course routes
app.get('/api/courses', auth, (req, res) => {
  res.json(courses);
});

// Enrollment routes
app.post('/api/enroll/:courseId', auth, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Students only' });
  }
  
  const existing = enrollments.find(e => e.student === req.user._id && e.course === req.params.courseId);
  if (existing) {
    return res.status(400).json({ message: 'Already enrolled' });
  }
  
  enrollments.push({
    _id: Date.now().toString(),
    student: req.user._id,
    course: req.params.courseId,
    status: 'pending',
    enrollmentDate: new Date()
  });
  
  res.json({ message: 'Enrollment request submitted' });
});

app.get('/api/enroll/my-courses', auth, (req, res) => {
  const approvedEnrollments = enrollments.filter(e => 
    e.student === req.user._id && e.status === 'approved'
  );
  const myCourses = approvedEnrollments.map(e => 
    courses.find(c => c._id === e.course)
  ).filter(Boolean);
  res.json(myCourses);
});

app.get('/api/enroll/my-pending', auth, (req, res) => {
  const pendingEnrollments = enrollments.filter(e => 
    e.student === req.user._id && e.status === 'pending'
  );
  const result = pendingEnrollments.map(e => ({
    ...e,
    course: courses.find(c => c._id === e.course)
  }));
  res.json(result);
});

// Admin routes
app.get('/api/students', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  const studentsWithoutPasswords = users.map(({ password, ...user }) => user);
  res.json(studentsWithoutPasswords);
});

app.get('/api/enroll/pending', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  
  const pending = enrollments.filter(e => e.status === 'pending').map(e => ({
    ...e,
    student: users.find(u => u._id === e.student),
    course: courses.find(c => c._id === e.course)
  }));
  res.json(pending);
});

app.put('/api/enroll/approve/:enrollmentId', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  
  const enrollment = enrollments.find(e => e._id === req.params.enrollmentId);
  if (enrollment) {
    enrollment.status = 'approved';
    res.json({ message: 'Enrollment approved' });
  } else {
    res.status(404).json({ message: 'Enrollment not found' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Demo server running on port ${PORT}`);
  console.log('Login credentials:');
  console.log('Admin: admin@test.com / admin123');
  console.log('Student: student@test.com / student123');
});