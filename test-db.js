const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    const Student = require('./models/Student');
    const count = await Student.countDocuments();
    console.log(`📊 Total students in database: ${count}`);
    
    if (count === 0) {
      console.log('❌ No users found. Run: npm run seed');
    } else {
      const users = await Student.find({}, 'email role');
      console.log('👥 Users in database:', users);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();