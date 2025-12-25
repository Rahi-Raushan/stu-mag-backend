const mongoose = require('mongoose');
const Student = require('./models/Student');
const Course = require('./models/Course');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing data
    await Student.deleteMany({});
    await Course.deleteMany({});
    
    // Create admin user
    const admin = new Student({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      age: 30,
      city: 'New York',
      contactNumber: '9999999999',
      fatherName: 'Admin Father',
      erpNo: 'ADMIN001',
      role: 'admin'
    });
    
    // Create student user
    const student = new Student({
      name: 'John Student',
      email: 'student@test.com', 
      password: 'student123',
      age: 20,
      city: 'Boston',
      contactNumber: '8888888888',
      fatherName: 'John Father',
      erpNo: 'STU001',
      role: 'student'
    });
    
    await admin.save();
    await student.save();
    
    // Create sample courses
    const courses = [
      {
        title: 'Computer Science Fundamentals',
        description: 'Introduction to programming, algorithms, and data structures'
      },
      {
        title: 'Web Development',
        description: 'Learn HTML, CSS, JavaScript, and modern web frameworks'
      },
      {
        title: 'Database Management',
        description: 'SQL, NoSQL databases, and database design principles'
      },
      {
        title: 'Software Engineering',
        description: 'Software development lifecycle, testing, and project management'
      },
      {
        title: 'Data Structures & Algorithms',
        description: 'Advanced data structures, algorithm analysis, and optimization'
      },
      {
        title: 'Machine Learning',
        description: 'Introduction to ML algorithms, neural networks, and AI'
      },
      {
        title: 'Mobile App Development',
        description: 'Android and iOS app development using modern frameworks'
      },
      {
        title: 'Cybersecurity',
        description: 'Network security, ethical hacking, and data protection'
      },
      {
        title: 'Cloud Computing',
        description: 'AWS, Azure, Google Cloud platforms and services'
      },
      {
        title: 'Digital Marketing',
        description: 'SEO, social media marketing, and online advertising'
      }
    ];
    
    await Course.insertMany(courses);
    
    console.log('Database seeded successfully!');
    console.log('Default users created:');
    console.log('Admin - Email: admin@test.com, Password: admin123');
    console.log('Student - Email: student@test.com, Password: student123');
    console.log('Sample courses created.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();