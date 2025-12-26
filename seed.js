const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./models/Student');
const Course = require('./models/Course');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Student.deleteMany({});
    await Course.deleteMany({});

    // Create admin user
    const admin = new Student({
      name: 'Admin User',
      email: 'admin@admin.com',
      password: 'admin123',
      age: 30,
      city: 'Admin City',
      contactNumber: '1234567890',
      fatherName: 'Admin Father',
      erpNo: 'ADMIN001',
      role: 'admin'
    });
    await admin.save();

    // Create sample student
    const student = new Student({
      name: 'John Doe',
      email: 'john@student.com',
      password: 'student123',
      age: 20,
      city: 'Student City',
      contactNumber: '9876543210',
      fatherName: 'John Father',
      erpNo: 'STU001',
      role: 'student'
    });
    await student.save();

    // Create sample courses
    const courses = [
      {
        title: 'Computer Science Fundamentals',
        description: 'Basic concepts of computer science including programming, data structures, and algorithms.'
      },
      {
        title: 'Web Development',
        description: 'Learn HTML, CSS, JavaScript, and modern web frameworks to build dynamic websites.'
      },
      {
        title: 'Database Management',
        description: 'Understanding relational databases, SQL, and database design principles.'
      },
      {
        title: 'Mobile App Development',
        description: 'Create mobile applications for Android and iOS platforms using modern frameworks.'
      }
    ];

    await Course.insertMany(courses);

    console.log('✅ Seed data created successfully!');
    console.log('Admin Login: admin@admin.com / admin123');
    console.log('Student Login: john@student.com / student123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();