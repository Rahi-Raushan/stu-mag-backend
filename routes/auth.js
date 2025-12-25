const express = require('express');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, age, city, contactNumber, fatherName, erpNo } = req.body;
    
    const existingStudent = await Student.findOne({ 
      $or: [{ email }, { erpNo }] 
    });
    if (existingStudent) {
      return res.status(400).json({ 
        message: existingStudent.email === email ? 'Email already exists' : 'ERP number already exists' 
      });
    }

    const student = new Student({ 
      name, 
      email, 
      password, 
      age, 
      city, 
      contactNumber,
      fatherName,
      erpNo,
      role: 'student'
    });
    await student.save();

    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET);
    res.status(201).json({ 
      token, 
      user: { 
        id: student._id, 
        name, 
        email, 
        role: student.role 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password });
    
    const student = await Student.findOne({ email });
    console.log('Found student:', student ? 'Yes' : 'No');
    
    if (!student) {
      console.log('Student not found');
      return res.status(401).json({ message: 'Invalid credentials - user not found' });
    }
    
    const passwordMatch = await student.comparePassword(password);
    console.log('Password match:', passwordMatch);
    
    if (!passwordMatch) {
      console.log('Password does not match');
      return res.status(401).json({ message: 'Invalid credentials - wrong password' });
    }

    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET);
    console.log('Login successful for:', email);
    res.json({ token, user: { id: student._id, name: student.name, email, role: student.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;